import { ofetch } from "ofetch";
import { sendErrorEmbed, type Profile } from "../utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessagePayload } from "discord.js";
import { getMember } from "../data/members";

type Breakdown = {
    key: string;
    season: string;
    type: string;
    class: string;
    total: number;
    progress: number;
    collections: Collection[];
}

type Collection = {
    id: string;
    collectionNo: string;
    frontImage: string;
    textColor: string;
    member: string;
    season: string;
    class: string;
    onOffline: string;
    obtained: boolean;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const nickname = options.get('nickname')?.value as string
        const member = options.get('member')?.value as string
        const onlineType = options.get('online_type')?.value as string

        const userFetch = await ofetch<{ profile: Profile }>(`https://api.cosmo.fans/user/v1/by-nickname/${nickname}`, {
            ignoreResponseError: true
        })
        const user = userFetch.profile
        if (!user) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('User not found.')]
            }))
        }

        const { name: memberParsed, profileImageUrl } = getMember(member)

        if (!memberParsed) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Invalid member.')]
            }))
        }

        const breakdownResponse = await ofetch<Breakdown[]>(`https://apollo.cafe/api/progress/breakdown/${memberParsed}/${user.address}`)

        /**
         * filter out any season-class combos that have no totals and group by season.
         */
        const items = breakdownResponse
            .filter((progress) => progress.total > 0)
            .reduce((acc, progress) => {
                if (!acc[progress.season]) {
                    acc[progress.season] = [];
                }

                // apply filter
                if (progress.type === "combined" && !onlineType) {
                    acc[progress.season].push(progress);
                } else if (progress.type === onlineType) {
                    acc[progress.season].push(progress);
                }

                return acc;
            }, {} as Record<string, Breakdown[]>);

        // filter out any seasons that have no class/online type combinations
        const seasons = Object.entries(items).filter(
            ([_, classes]) => classes.length > 0
        );

        // calculate total progress
        const { progress, total } = Object.values(items).reduce(
            (acc, progresses) => {
                for (const progress of progresses) {
                    acc.progress += progress.progress;
                    acc.total += progress.total;
                }
                return acc;
            },
            {
                progress: 0,
                total: 0,
            }
        );
        const percentage = Math.floor((progress / total) * 100);

        const url = `https://apollo.cafe/@${nickname}/progress?member=${memberParsed}`

        const embed = new EmbedBuilder()
            .setColor('#7281B8')
            .setTitle(`${memberParsed} Progress`)
            .setDescription(`${progress}/${total} (${percentage}%)`)
            .setAuthor({ name: `${user.nickname}`, url: url })
            .setThumbnail(profileImageUrl)

        for (const [season, classes] of seasons) {
            embed.addFields({
                name: season,
                value: classes.map((c) => `${c.class} class: ${c.progress}/${c.total} (${Math.floor((c.progress / c.total) * 100)}%)`).join('\n'),
            })
        }

        const linkButton = new ButtonBuilder()
            .setURL(url)
            .setLabel('View in Apollo')
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(linkButton);

        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [embed],
            components: [row]
        }))
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while processing your request. Please try again later.')]
        }))
    }
}