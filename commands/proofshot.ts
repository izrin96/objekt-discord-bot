import { AttachmentBuilder, EmbedBuilder, MessagePayload, ChatInputCommandInteraction } from "discord.js";
import { getMember } from "../data/members";
import { sendErrorEmbed } from "../utils";
import { getSeason } from "../data/season";
import { getObjekts } from "../utils/objekt";
import { initBrowser } from "../utils/browser";
import { server } from "../utils/server";

export async function execute(interaction: ChatInputCommandInteraction) {
    const { options } = interaction;

    await interaction.deferReply({
        ephemeral: options.get('secret')?.value as boolean | undefined
    });

    const member = options.get('member')?.value as string
    const collectionNo = options.get('collection_no')?.value as string
    const image = options.get('image')?.attachment.url

    const { name: memberParsed } = getMember(member);

    if (!memberParsed) {
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('Invalid member.')]
        }))
    }

    const collectionPattern = /^([a-zA-Z]?)(\d{3})([azAZ]?)$/;
    const match = collectionNo.match(collectionPattern);

    if (!match) {
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('Invalid collection number format.')]
        }));
    }

    const [, seasonCode, number, type] = match;

    const season = getSeason(seasonCode)
    if (seasonCode && !season)
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('Invalid season code.')]
        }));

    try {
        const objekts = await getObjekts({
            member: memberParsed,
            collection: {
                season,
                number,
                type,
            },
        })

        const objekt = objekts[0]
        if (!objekt) {
            return interaction.editReply(new MessagePayload(interaction, {
                embeds: [sendErrorEmbed('Objekt not found.')]
            }));
        }

        const objektImageUrl = objekt.frontImage

        const browser = await initBrowser()
        const page = await browser.newPage();

        // Navigate to the proof page
        await page.goto(`${server.url.origin}/proof`);

        // Replace the objekt image and wait for it to load with a timeout
        await page.evaluate(async (url) => {
            const objektImg = document.querySelector('#objekt') as HTMLImageElement;
            if (objektImg) {
                objektImg.src = url;
                await Promise.race([
                    new Promise((resolve) => {
                        objektImg.onload = resolve;
                    }),
                    new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout
                ]);
            }
        }, objektImageUrl);

        // Replace the user image and wait for it to load with a timeout
        await page.evaluate(async (url) => {
            const userImg = document.querySelector('#user') as HTMLImageElement;
            if (userImg) {
                userImg.src = url;
                await Promise.race([
                    new Promise((resolve) => {
                        userImg.onload = resolve;
                    }),
                    new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout
                ]);
            }
        }, image);

        // Wait for a short time to ensure all rendering is complete
        await page.waitForTimeout(1000);

        // Take a screenshot of the container
        const element = await page.$('#container');
        const screenshot = await element.screenshot({ type: 'png' });

        // Close the page, but keep the browser running
        await page.close();

        const attachment = new AttachmentBuilder(Buffer.from(screenshot), { name: 'proofshot.png' });

        return interaction.editReply(new MessagePayload(interaction, {
            files: [attachment],
            embeds: [new EmbedBuilder().setColor('#7281B8').setDescription('This proof shot is meant to be used for fun. We may disable this command in the future.')]
        }));
    } catch (error) {
        console.error('Error generating proofshot:', error);
        return interaction.editReply(new MessagePayload(interaction, {
            embeds: [sendErrorEmbed('An error occurred while generating the proofshot.')]
        }));
    }
}
