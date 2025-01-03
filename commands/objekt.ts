import { ofetch } from "ofetch";
import { getEdition, getRarity, sendErrorEmbed, type ObjektsFetch, type ObjektsMetadata } from "../utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessagePayload, type APIEmbedField, type HexColorString } from "discord.js";
import { getMember } from "../data/members";
import { getSeason } from "../data/season";
import { getObjekts } from "../utils/objekt";

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const collectionNo = options.get('collection_no')?.value as string
        const member = options.get('member')?.value as string

        let result: ObjektsFetch['objekts'] = []

        const { name: memberParsed } = getMember(member)

        if (!memberParsed) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Invalid member.')]
            }))
        }

        if (collectionNo) {
            const collectionPattern = /^([a-zA-Z]?)(\d{3})([azAZ]?)$/;
            const match = collectionNo.match(collectionPattern);

            if (!match) {
                return interaction.editReply(new MessagePayload(interaction, {
                    embeds: [sendErrorEmbed('Invalid collection number format.')]
                }));
            }

            const [, seasonCode, number, type] = match;

            const season = getSeason(seasonCode)

            if (seasonCode && !season) {
                return interaction.editReply(new MessagePayload(interaction, {
                    embeds: [sendErrorEmbed('Invalid season code.')]
                }));
            }

            result = await getObjekts({
                member: memberParsed,
                collection: {
                    season,
                    number,
                    type,
                },
            })
        } else {
            result = await getObjekts({
                member: memberParsed,
            })
        }

        const objekt = result[0]
        if (!objekt) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Objekt not found.')]
            }));
        }

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

        if (objekt.class === 'First')
        {
            fields.splice(fields.length - 1, 0, { name: 'Edition', value: `${getEdition(objekt.collectionNo)}`, inline: true })
        }

        const embed = new EmbedBuilder()
            .setColor(objekt.accentColor as HexColorString)
            .setTitle(objekt.collectionId)
            // .setURL(`https://apollo.cafe/objekts?member=${objekt.member}&id=${objekt.slug}`)
            .addFields(fields)
            .setImage(`${process.env.URL}/objekt-preview/${objekt.slug}`)
            .setTimestamp(new Date(objekt.createdAt))
            .setFooter({ text: `Source by ${metadata?.metadata?.profile?.nickname}` });

        const apolloButton = new ButtonBuilder()
            .setURL(`https://apollo.cafe/objekts?member=${objekt.member}&id=${objekt.slug}`)
            .setLabel('View in Apollo')
            .setStyle(ButtonStyle.Link);

        const lunarButton = new ButtonBuilder()
            .setURL(`https://lunar-cosmo.vercel.app/?id=${objekt.slug}`)
            .setLabel('View in Lunar')
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(apolloButton, lunarButton);

        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [embed],
            components: [row]
        }));
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while processing your request. Please try again later.')]
        }));
    }
}