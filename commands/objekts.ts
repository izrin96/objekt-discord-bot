import { ofetch } from "ofetch";
import { getEdition, getRarity, sendErrorEmbed, type ObjektsFetch, type ObjektsMetadata } from "../utils";
import { ButtonBuilder, ButtonStyle, EmbedBuilder, MessagePayload, type HexColorString, ChatInputCommandInteraction, type APIEmbedField } from "discord.js";
import { artists, getArtist, getMember } from "../data/members";
import { Pagination, type PButtonBuilder } from "pagination.djs";
import { fetchObjekts } from "../utils/objekt";

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const artist = options.get('artist')?.value as string
        const member = options.get('member')?.value as string
        const classOption = options.get('class')?.value as string
        const season = options.get('season')?.value as string
        const on_offline = options.get('online_type')?.value as string
        const page = options.get('page')?.value as number

        let result: ObjektsFetch['objekts'] = []

        const { name: artistParsed } = getArtist(artist)
        if (artist && !artistParsed)
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed(`Invalid artist. Available: ${artists.join(', ')}`)]
            }));

        const { name: memberParsed } = getMember(member)

        result = await fetchObjekts({
            member: memberParsed,
            artist: artistParsed,
            class: classOption,
            season,
            on_offline,
            page: page ? page - 1 : undefined,
        })

        // result = result.slice(0, 30)

        if (result.length === 0)
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Objekt not found.')]
            }));

        const embeds = []

        for (const objekt of result) {
            try {
                const metadata = await ofetch<ObjektsMetadata>(`https://apollo.cafe/api/objekts/metadata/${objekt.slug}`)
                const copies = metadata?.total

                const fields: APIEmbedField[] = [
                    { name: 'Artist', value: objekt.artist ?? '-', inline: true },
                    { name: 'Member', value: objekt.member ?? '-', inline: true },
                    { name: 'Season', value: objekt.season ?? '-', inline: true },
                    { name: 'Class', value: objekt.class ?? '-', inline: true },
                    { name: 'Collection No.', value: objekt.collectionNo ?? '-', inline: true },
                    { name: 'Type', value: objekt.onOffline === 'online' ? 'Digital' : 'Physical', inline: true },
                    { name: 'Copies', value: `${copies}`, inline: true },
                    { name: 'Rarity', value: `${getRarity(parseInt(copies))}`, inline: true },
                    { name: 'Tradable', value: `${metadata?.percentage ?? '-'}% (${metadata?.transferable ?? '-'})`, inline: true },
                    { name: 'Accent Color', value: `${objekt.accentColor ?? '-'}`, inline: true },
                    { name: 'Description', value: metadata?.metadata?.description ?? '-' },
                ]

                if (objekt.class === 'First') {
                    fields.splice(fields.length - 1, 0, { name: 'Edition', value: `${getEdition(objekt.collectionNo)}`, inline: true })
                }

                const embed = new EmbedBuilder()
                    .setColor(objekt.accentColor as HexColorString)
                    .setTitle(objekt.collectionId)
                    // .setURL(`https://apollo.cafe/objekts?member=${objekt.member}&id=${objekt.slug}`)
                    .addFields(fields)
                    .setImage(`${process.env.URL}/objekt-preview/${objekt.slug}`)
                    .setTimestamp(new Date(objekt.createdAt))

                embeds.push(embed)
            } catch (error) {
                console.error(`Error processing objekt ${objekt.slug}:`, error);
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
                .setURL(`https://apollo.cafe/objekts?${new URLSearchParams(Object.fromEntries(Object.entries({ artist: artistParsed, member: memberParsed, class: classOption, season: season, on_offline }).filter(([_, v]) => v !== undefined))).toString()}`) as PButtonBuilder,
            // link2: new ButtonBuilder()
            //     .setLabel('View in Lunar')
            //     .setStyle(ButtonStyle.Link)
            //     .setURL(`https://lunar-cosmo.vercel.app/?${new URLSearchParams(Object.fromEntries(Object.entries({ artist: artistParsed, member: memberParsed, class: classOption, season: season, on_offline }).filter(([_, v]) => v !== undefined))).toString()}`) as PButtonBuilder
        };

        return pagination.render();
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while processing your request. Please try again later.')]
        }));
    }
}