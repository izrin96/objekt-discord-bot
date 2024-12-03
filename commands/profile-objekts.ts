import { ofetch } from "ofetch";
import { getRarity, getSlug, sendErrorEmbed, type Objekt, type ObjektOwned, type ObjektsMetadata, type Profile } from "../utils";
import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessagePayload, time, type HexColorString } from "discord.js";
import { artists, getArtist, getMember } from "../data/members";
import { fetchOwnedObjekts } from "../utils/objekt-owned";
import { Pagination, type PButtonBuilder } from "pagination.djs";

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const nickname = options.get('nickname')?.value as string
        const artist = options.get('artist')?.value as string
        const member = options.get('member')?.value as string
        const classOption = options.get('class')?.value as string
        const season = options.get('season')?.value as string
        const on_offline = options.get('online_type')?.value as string
        const page = options.get('page')?.value as number

        const userFetch = await ofetch<{ profile: Profile }>(`https://api.cosmo.fans/user/v1/by-nickname/${nickname}`, {
            ignoreResponseError: true
        })
        const user = userFetch.profile

        if (!user) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('User not found.')]
            }));
        }

        const { name: artistParsed } = getArtist(artist)
        if (artist && !artistParsed)
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed(`Invalid artist. Available: ${artists.join(', ')}`)]
            }));

        const { name: memberParsed } = getMember(member)

        let resultOwned: ObjektOwned[]

        resultOwned = await fetchOwnedObjekts({
            address: user.address,
            artist: artistParsed,
            member: memberParsed,
            class: classOption,
            season,
            on_offline,
            start_after: page ? (page - 1) * 30 : undefined,
        })

        // resultOwned = resultOwned.slice(0, 30)

        const embeds = []

        for (const objektOwned of resultOwned) {
            try {
                const slug = getSlug(objektOwned.collectionId)

                const objekt = await ofetch<Objekt>(`https://apollo.cafe/api/objekts/by-slug/${slug}`)

                const metadata = await ofetch<ObjektsMetadata>(`https://apollo.cafe/api/objekts/metadata/${slug}`)
                const copies = metadata?.total ?? 0

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: user.nickname,
                        url: `https://apollo.cafe/@${user.nickname}`,
                    })
                    .setColor(objekt.accentColor as HexColorString)
                    .setTitle(objekt.collectionId)
                    .setURL(`https://apollo.cafe/objekts?member=${objekt.member}&id=${objekt.slug}`)
                    .addFields(
                        { name: 'Artist', value: objekt.artist ?? '-', inline: true },
                        { name: 'Member', value: objekt.member ?? '-', inline: true },
                        { name: 'Season', value: objekt.season ?? '-', inline: true },
                        { name: 'Class', value: objekt.class ?? '-', inline: true },
                        { name: 'Collection No.', value: objekt.collectionNo ?? '-', inline: true },
                        { name: 'Type', value: objekt.onOffline === 'online' ? 'Digital' : 'Physical', inline: true },
                        { name: 'Copies', value: `${copies}`, inline: true },
                        { name: 'Rarity', value: `${getRarity(copies)}`, inline: true },
                        { name: 'Serial', value: `${objektOwned.objektNo ?? '-'}`, inline: true },
                        { name: 'Received at', value: time(new Date(objektOwned.receivedAt)), inline: true },
                        { name: 'Transferable', value: objektOwned.transferable ? 'Yes' : 'No', inline: true },
                        { name: 'Used for grid', value: objektOwned.usedForGrid ? 'Yes' : 'No', inline: true },
                        { name: 'Description', value: metadata?.metadata?.description ?? '-' },
                    )
                    .setImage(`https://objekt-discord-bot.fly.dev/objekt-preview/${objekt.slug}?serial=${objektOwned.objektNo}`)
                    .setTimestamp(new Date(objekt.createdAt))
                    .setFooter({ text: `Source by ${metadata?.metadata?.profile?.nickname}` });

                embeds.push(embed)
            } catch (error) {
                console.error(`Error processing objekt ${objektOwned.collectionId}:`, error);
                // Skip this objekt and continue with the next one
            }
        }

        if (embeds.length === 0) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Objekt not found.')]
            }));
        }

        const pagination = new Pagination(interaction, {
            idle: 1000 * 60 * 60,
        });

        pagination.setAuthorizedUsers([])

        pagination.setEmbeds(embeds, (embed, index, array) => {
            return embed.setFooter({ text: `Objekt: ${index + 1}/${array.length}` });
        });

        pagination.buttons = {
            ...pagination.buttons, link: new ButtonBuilder()
                .setLabel('View in Apollo')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://apollo.cafe/@${user.nickname}?${new URLSearchParams(Object.fromEntries(Object.entries({ artist: artistParsed, member: memberParsed, class: classOption, season: season, on_offline }).filter(([_, v]) => v !== undefined))).toString()}`) as PButtonBuilder
        };

        return pagination.render();
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while processing your request. Please try again later.')]
        }));
    }
}