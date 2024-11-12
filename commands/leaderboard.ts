import { ofetch } from "ofetch";
import { sendErrorEmbed } from "../utils";
import { ChatInputCommandInteraction, EmbedBuilder, MessagePayload } from "discord.js";
import { getMember } from "../data/members";

type Leaderboard = {
    count: number;
    nickname: string;
    address: string;
    isAddress: boolean;
}

type LeaderboardResponse = {
    leaderboard: Leaderboard[];
    total: number;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const member = options.get('member')?.value as string
        const season = options.get('season')?.value as string
        const onlineType = options.get('online_type')?.value as string

        const { name: memberParsed, profileImageUrl } = getMember(member)

        if (!memberParsed) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Invalid member.')]
            }));
        }

        const seasonResponse = await ofetch<LeaderboardResponse>(`https://apollo.cafe/api/progress/leaderboard/${memberParsed}`, {
            query: {
                season: season ?? "",
                onlineType: onlineType ?? ""
            }
        })

        const strings = []

        for (const leaderboard of seasonResponse.leaderboard) {
            const percentage = Math.floor(leaderboard.count / seasonResponse.total * 100)
            strings.push(`${seasonResponse.leaderboard.indexOf(leaderboard) + 1}. [${leaderboard.nickname}](https://apollo.cafe/@${leaderboard.isAddress ? leaderboard.address : leaderboard.nickname}) - ${percentage}% (${leaderboard.count})`)
        }

        const embed = new EmbedBuilder()
            .setColor('#7281B8')
            .setTitle(`Leaderboard (${memberParsed})`)
            .setThumbnail(profileImageUrl)
            .setDescription(`Season: ${season ?? 'All'}\nOnline type: ${options.get('online_type')?.name ?? 'All'}\nTotal objekts: ${seasonResponse.total}\n` + strings.join('\n'))

        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [embed]
        }));
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while processing your request. Please try again later.')]
        }));
    }
}