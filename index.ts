import { ChatInputCommandInteraction, CommandInteractionOptionResolver, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { execute as objektCommand } from './commands/objekt';
import { execute as objektsCommand } from './commands/objekts';
import { execute as tradesCommand } from './commands/trades';
import { execute as proofShotCommand } from './commands/proofshot';
import { execute as profileObjektCommand } from './commands/profile-objekt';
import { execute as profileObjektsCommand } from './commands/profile-objekts';
import { execute as seasonCommand } from './commands/season';
import { execute as leaderboardCommand } from './commands/leaderboard';
import { execute as breakdownCommand } from './commands/breakdown';
import { artists } from './data/members';
import { validClasses } from './utils';
import { seasons } from './data/season';
import { client } from './utils/client';
import { server } from './utils/server'

const rest = new REST().setToken(process.env.TOKEN);

console.log(`Listening to port: ${server.url.port}`)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        if (commandName === 'objekt') {
            return objektCommand(interaction);
        }

        if (commandName === 'trades') {
            return tradesCommand(interaction)
        }

        if (commandName === 'objekts') {
            return objektsCommand(interaction)
        }

        if (commandName === 'proofshot') {
            return proofShotCommand(interaction);
        }

        if (commandName === 'season') {
            return seasonCommand(interaction);
        }

        if (commandName === 'leaderboard') {
            return leaderboardCommand(interaction);
        }

        if (commandName === 'user') {
            const subcommand = (options as CommandInteractionOptionResolver).getSubcommand();
            if (subcommand === 'objekt') {
                return profileObjektCommand(interaction);
            }
            if (subcommand === 'objekts') {
                return profileObjektsCommand(interaction);
            }
            if (subcommand === 'progress') {
                return breakdownCommand(interaction);
            }
        }
    } catch (e) {
        console.error(e)
    }
});

async function registerGlobalCommands() {
    await rest.put(Routes.applicationCommands(process.env.ID), {
        body: [
            new SlashCommandBuilder()
                .setName('objekt')
                .setDescription('Find latest Objekt')
                .addStringOption(option =>
                    option.setName('member')
                        .setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\'')
                        .setRequired(true)
                    // .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('collection_no')
                        .setDescription('Format: [season]<collection_no>[type] Example: d207z or e315')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName('trades')
                .setDescription('Show latest trades perform by user (limit to 30)')
                .addStringOption(option => option.setName('nickname').setDescription('Cosmo nickname').setRequired(true))
                .addIntegerOption(option => option.setName('page').setDescription('Page number. Each page has 30 trades sorted by newest. Default: 1').setMinValue(1).setRequired(false)),
            new SlashCommandBuilder()
                .setName('objekts')
                .setDescription('Show all latest Objekts (limit to 60)')
                .addStringOption(option =>
                    option.setName('artist')
                        .setDescription('Choose one artist. Example: tripleS')
                        .addChoices(artists.map((value) => ({ name: value.name, value: value.name }))))
                .addStringOption(option =>
                    option.setName('member')
                        .setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\''))
                .addStringOption(option =>
                    option.setName('class')
                        .setDescription('Objekt class. Example: Double')
                        .addChoices(validClasses.map((value) => ({ name: value, value: value }))))
                .addStringOption(option =>
                    option.setName('season')
                        .setDescription('Objekt season. Example: Divine01')
                        .addChoices(Object.entries(seasons).map(([_, value]) => ({ name: value, value: value }))))
                .addStringOption(option =>
                    option.setName('online_type')
                        .setDescription('Digital or physical')
                        .addChoices([{ name: 'Digital', value: 'online' }, { name: 'Physical', value: 'offline' }]))
                .addIntegerOption(option => option.setName('page').setDescription('Page number. Each page has 60 Objekts sorted by newest. Default: 1').setMinValue(1).setRequired(false)),
            new SlashCommandBuilder()
                .setName('proofshot')
                .setDescription('Generate proof shot')
                .addStringOption(option => option.setName('member').setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\'').setRequired(true))
                .addStringOption(option => option.setName('collection_no').setDescription('Format: [season]<collection_no>[type] Example: d207z or e315').setRequired(true))
                .addAttachmentOption(option => option.setName('image').setDescription('Image to generate proof shot').setRequired(true))
                .addBooleanOption(option => option.setName('secret').setDescription('Generated proof shot will be sent secretly to you').setRequired(false)),
            new SlashCommandBuilder()
                .setName('user')
                .setDescription('Show user information') // cannot remove, otherwise will thrown error
                .addSubcommand(subcommand => subcommand
                    .setName('objekt')
                    .setDescription('Find latest Objekt owned by user')
                    .addStringOption(option => option.setName('nickname').setDescription('Cosmo nickname').setRequired(true))
                    .addStringOption(option => option.setName('member').setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\'').setRequired(true))
                    .addStringOption(option => option.setName('collection_no').setDescription('Format: [season]<collection_no>[type] Example: d207z or e315').setRequired(true)))
                .addSubcommand(subcommand => subcommand
                    .setName('objekts')
                    .setDescription('Show all latest Objekts owned by user (limit to 30)')
                    .addStringOption(option =>
                        option.setName('nickname')
                            .setDescription('Cosmo nickname').setRequired(true))
                    .addStringOption(option =>
                        option.setName('artist')
                            .setDescription('Choose one artist. Example: tripleS')
                            .addChoices(artists.map((value) => ({ name: value.name, value: value.name }))))
                    .addStringOption(option =>
                        option.setName('member')
                            .setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\''))
                    .addStringOption(option =>
                        option.setName('class')
                            .setDescription('Objekt class. Example: Double')
                            .addChoices(validClasses.map((value) => ({ name: value, value: value }))))
                    .addStringOption(option =>
                        option.setName('season')
                            .setDescription('Objekt season. Example: Divine01')
                            .addChoices(Object.entries(seasons).map(([_, value]) => ({ name: value, value: value }))))
                    .addStringOption(option =>
                        option.setName('online_type')
                            .setDescription('Digital or physical')
                            .addChoices([{ name: 'Digital', value: 'online' }, { name: 'Physical', value: 'offline' }]))
                    .addIntegerOption(option => option.setName('page').setDescription('Page number. Each page has 30 Objekts sorted by newest. Default: 1').setMinValue(1).setRequired(false)))
                .addSubcommand(subcommand => subcommand
                    .setName('progress')
                    .setDescription('Show user\'s objekt progress')
                    .addStringOption(option => option.setName('nickname').setDescription('Cosmo nickname').setRequired(true))
                    .addStringOption(option => option.setName('member').setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\'').setRequired(true))
                    .addStringOption(option => option.setName('online_type').setDescription('Digital or physical').addChoices([{ name: 'Digital', value: 'online' }, { name: 'Physical', value: 'offline' }]))),
            new SlashCommandBuilder()
                .setName('season')
                .setDescription('Show current season for artist')
                .addStringOption(option => option.setName('artist').setDescription('Choose one artist. Example: tripleS').setRequired(true).addChoices(artists.map((value) => ({ name: value.name, value: value.name })))),
            new SlashCommandBuilder()
                .setName('leaderboard')
                .setDescription('Show leaderboard for member')
                .addStringOption(option => option.setName('member').setDescription('Choose one member. Example: jiwoo. Can be shortform such as \'jw\'').setRequired(true))
                .addStringOption(option => option.setName('season').setDescription('Objekt season. Example: Divine01').addChoices(Object.entries(seasons).map(([_, value]) => ({ name: value, value: value }))))
                .addStringOption(option => option.setName('online_type').setDescription('Digital or physical').addChoices([{ name: 'Digital', value: 'online' }, { name: 'Physical', value: 'offline' }]))
        ],
    })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}

await registerGlobalCommands();

client.login(process.env.TOKEN);
