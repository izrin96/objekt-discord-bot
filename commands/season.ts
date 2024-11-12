import { ofetch } from "ofetch";
import { sendErrorEmbed } from "../utils";
import { ChatInputCommandInteraction, EmbedBuilder, MessagePayload, time } from "discord.js";
import { artists, getArtist, } from "../data/members";

type Season = {
    title: string;
    startDate: string;
    endDate: string;
}

type SeasonResponse = {
    seasons: Season[];
    currentSeason: Season;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const artist = options.get('artist')?.value as string

        const { name: artistParsed, logoImageUrl } = getArtist(artist)
        if (!artistParsed)
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed(`Invalid artist. Available: ${artists.join(', ')}`)]
            }));

        const seasonResponse = await ofetch<SeasonResponse>(`https://api.cosmo.fans/season/v2/${artist}`)

        const embed = new EmbedBuilder()
            .setColor('#7281B8')
            .setTitle(`Season for ${artistParsed}`)
            .setThumbnail(logoImageUrl)

        for (const season of seasonResponse.seasons) {
            embed.addFields({ name: season.title, value: `${time(new Date(season.startDate))} - ${season.endDate ? time(new Date(season.endDate)) : 'Ongoing'}`, })
        }

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