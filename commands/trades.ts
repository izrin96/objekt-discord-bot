import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessagePayload, time } from "discord.js";
import { ofetch } from "ofetch";
import { Pagination, type PButtonBuilder } from "pagination.djs";
import { sendErrorEmbed, type Profile, type Transfer } from "../utils";

const nullAddress = "0x0000000000000000000000000000000000000000";

function generateEmbed({ user, tradeString, count }: { user: Profile, tradeString: string[], count: number }) {
    const embed = new EmbedBuilder()
        .setColor('#7281B8')
        .setAuthor({
            name: user.nickname,
            url: `https://apollo.cafe/@${user.nickname}/trades`,
        })
        .setTitle(`${count} trades`)
        .setDescription(tradeString.join('\n'))
    return embed
}

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { options } = interaction;

        await interaction.deferReply();

        const nickname = options.get('nickname')?.value as string
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

        const transfersResult = await ofetch<{ results: Transfer[], count: number, hasNext: boolean, nextStartAfter: number }>(`https://apollo.cafe/api/transfers/${user.address}`, {
            query: {
                page: page ? page - 1 : undefined
            }
        })
        const limit = 7
        const transfers = transfersResult.results
        const totalPage = Math.ceil(transfers.length / limit);

        const embeds = []
        for (let i = 0; i < totalPage; i++) {
            const j = i * limit;
            const tradeString = transfers.slice(j, j + limit).map(row => {
                const name = row.collection.collectionId ? `${row.collection.collectionId} #${row.serial}` : "Unknown";
                const isReceiver = row.transfer.to.toLowerCase() === user.address.toLowerCase();
                const _user = isReceiver ? (row.transfer.from === nullAddress ? 'COSMO' : (row.nickname ?? row.transfer.from.substring(0, 8))) : (row.nickname ?? row.transfer.to.substring(0, 8))
                const addr = isReceiver ? (row.transfer.from === nullAddress ? 'COSMO' : (row.nickname ?? row.transfer.from)) : (row.nickname ?? row.transfer.to)
                const action = isReceiver ? "From" : "To";
                const timeString = time(new Date(row.transfer.timestamp));
                const userString = row.transfer.from === nullAddress ? 'COSMO' : `[${_user}](https://apollo.cafe/@${addr})`
                return `${timeString} ${name} - ${action} ${userString}`
            })
            const embed = generateEmbed({
                count: transfersResult.count,
                tradeString,
                user
            })
            embeds.push(embed);
        }

        const pagination = new Pagination(interaction, {
            idle: 1000 * 60 * 60,
        });

        pagination.setAuthorizedUsers([])

        pagination.setEmbeds(embeds, (embed, index, array) => {
            return embed.setFooter({ text: `Showing ${index * limit + 1}-${Math.min((index + 1) * limit, transfers.length)} trades` });
        });

        pagination.buttons = {
            ...pagination.buttons, link: new ButtonBuilder()
                .setLabel('View in Apollo')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://apollo.cafe/@${user.nickname}/trades`) as PButtonBuilder
        };

        return pagination.render()
    } catch (error) {
        console.error('Error in execute function:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while fetching trade data. Please try again later.')]
        }));
    }
}