/**
 * Interactive command guide.
 *
 * This module owns only the help UI. Commands are flattened into individual
 * browseable entries here; command dispatch and the command registry remain
 * unchanged.
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { getAll } = require('../handlers/commandRegistry');
const { COLORS } = require('../utils/embeds');

const TIMEOUT = 120_000;
const SMALL_CATEGORY_LIMIT = 2;

const CATEGORY_META = {
    moderation:  { emoji: '🔨', label: 'Moderation' },
    security:    { emoji: '🛡️', label: 'Security' },
    staff:       { emoji: '👮', label: 'Staff' },
    levels:      { emoji: '📊', label: 'Levels' },
    tickets:     { emoji: '🎫', label: 'Tickets' },
    voicemaster: { emoji: '🎙️', label: 'Voice' },
    config:      { emoji: '⚙️', label: 'Config' },
    info:        { emoji: '🔍', label: 'Info' },
    fun:         { emoji: '🎮', label: 'Fun' },
    utility:     { emoji: '🔧', label: 'Utility' },
    media:       { emoji: '🖼️', label: 'Media' },
    music:       { emoji: '🎵', label: 'Music' },
    economy:     { emoji: '💰', label: 'Economy' },
    server:      { emoji: '🏠', label: 'Server' },
    reaction:    { emoji: '👍', label: 'Reaction' },
    filter:      { emoji: '🧹', label: 'Filter' },
};

/*
 * The command registry is the normal source of help metadata, but a number
 * of older systems dispatch their commands from module-local maps. Keep the
 * guide complete by describing those live commands here too. These entries
 * are intentionally metadata-only; command execution remains in index.js and
 * the feature modules.
 */
const HELP_OVERRIDES = {
    antinuke: {
        helpOnBare: false,
        subcommands: [
            { name: 'setup', description: 'Review the AntiNuke setup and protection options.' },
            { name: 'list', description: 'View enabled protection modules and whitelist entries.' },
            { name: 'config', description: 'View the complete AntiNuke configuration.' },
            { name: 'admins', description: 'View AntiNuke administrators.' },
            { name: 'enable', description: 'Enable AntiNuke protection.' },
            { name: 'disable', description: 'Disable AntiNuke protection.' },
            { name: 'admin <@user>', description: 'Add or remove an AntiNuke administrator.' },
            { name: 'whitelist <@user>', description: 'Toggle a user in the AntiNuke whitelist.' },
            { name: 'log #channel', description: 'Set the AntiNuke log channel.' },
            { name: 'permissions [list|grant|remove|punishment] [permission|action]', description: 'Manage dangerous permission watches.' },
            { name: 'kick <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against unauthorized kicks.' },
            { name: 'webhook <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against webhook abuse.' },
            { name: 'emoji <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against emoji abuse.' },
            { name: 'ban <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against unauthorized bans.' },
            { name: 'channel <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against channel abuse.' },
            { name: 'role <on|off> [--threshold N] [--do ban|kick|strip] [--command on|off]', description: 'Protect against role abuse.' },
            { name: 'vanity <on|off> [--do ban|kick|strip]', description: 'Protect the server vanity URL.' },
            { name: 'botadd <on|off>', description: 'Block unauthorized bot additions.' },
        ],
    },
    antiraid: {
        helpOnBare: false,
        subcommands: [
            { name: 'config', description: 'View the current AntiRaid configuration.' },
            { name: 'state', description: 'Turn off the active raid state and unlock channels.' },
            { name: 'whitelist <@user>', description: 'Temporarily whitelist a user for their next join.' },
            { name: 'whitelist view', description: 'View current one-time whitelist entries.' },
            { name: 'massjoin on|off [--threshold N] [--do ban|kick] [--lock true|false] [--punish true|false]', description: 'Detect mass joins and optionally lock or punish.' },
            { name: 'newaccounts|age on|off [--threshold days] [--do ban|kick]', description: 'Block accounts newer than the configured age.' },
            { name: 'avatar on|off [--do ban|kick]', description: 'Block accounts without a profile avatar.' },
        ],
    },
    automod: {
        helpOnBare: false,
        subcommands: [
            { name: 'enable', description: 'Enable AutoMod.' },
            { name: 'disable', description: 'Disable AutoMod.' },
            { name: 'spam', description: 'Toggle the spam filter.' },
            { name: 'caps', description: 'Toggle the caps filter.' },
            { name: 'invites', description: 'Toggle the invite filter.' },
            { name: 'links', description: 'Toggle the link filter.' },
            { name: 'mentions', description: 'Toggle the mention filter.' },
            { name: 'emoji', description: 'Toggle the emoji filter.' },
            { name: 'attachments', description: 'Toggle the attachment filter.' },
            { name: 'profanity', description: 'Toggle the profanity filter.' },
            { name: 'punishment <type> <warn|timeout|kick|ban>', description: 'Set a punishment for an AutoMod filter type.' },
            { name: 'threshold <number>', description: 'Set the spam threshold.' },
            { name: 'whitelist <add|remove> #channel|@role', description: 'Add or remove an AutoMod exemption.' },
            { name: 'logchannel #channel', description: 'Set the AutoMod log channel.' },
        ],
    },
    levels: {
        helpOnBare: false,
        subcommands: [
            { name: 'rank [@user]', description: 'View a member’s level, XP, and progress.' },
            { name: 'leaderboard [page]', description: 'View the XP leaderboard and jump to a page.' },
            { name: 'leaderboard rename <title>', description: 'Rename the leaderboard.' },
            { name: 'config', description: 'View level system settings.' },
            { name: 'enable|unlock', description: 'Enable XP gain.' },
            { name: 'disable|lock', description: 'Disable XP gain.' },
            { name: 'setrate <number>', description: 'Set the XP gain multiplier.' },
            { name: 'messages', description: 'View level-up message settings.' },
            { name: 'message [view|<text>]', description: 'View or set the level-up message.' },
            { name: 'messagemode <channel|dm|custom>', description: 'Set where level-up messages are sent.' },
            { name: 'ignore <#channel|@role>', description: 'Toggle an ignored channel or role for XP.' },
            { name: 'roles|list', description: 'View level reward roles.' },
            { name: 'add <level> @role', description: 'Add or replace a level reward role.' },
            { name: 'remove <level>', description: 'Remove a level reward role.' },
            { name: 'update <level> @role', description: 'Update a level reward role.' },
            { name: 'stackroles', description: 'Toggle whether members keep earlier level roles.' },
            { name: 'reset @user', description: 'Reset a member’s XP and level.' },
            { name: 'cleanup', description: 'Remove stale user level records.' },
            { name: 'sync', description: 'Sync level reward roles to members.' },
        ],
    },
    levelupmsg: {
        category: 'levels',
        subcommands: [
            { name: 'enable', description: 'Enable level-up messages.' },
            { name: 'disable', description: 'Disable level-up messages.' },
            { name: 'channel #channel', description: 'Set the level-up announcement channel.' },
            { name: 'message <text|embed-code>', description: 'Set the level-up message template.' },
            { name: 'preview', description: 'Preview the current level-up message.' },
            { name: 'test', description: 'Test the level-up message.' },
            { name: 'view', description: 'View the current level-up message configuration.' },
        ],
    },
    nuke: {
        helpOnBare: false,
        description: 'Ask for confirmation, then delete and recreate a channel. Scheduled nukes remain available.',
        usage: '.nuke [#channel] [reason]',
        subcommands: [
            { name: '[#channel] [reason]', description: 'Ask for confirmation before immediately nuking a channel.' },
            { name: 'schedule <time> [#channel] [reason]', description: 'Schedule a future nuke.' },
            { name: 'list', description: 'View scheduled nukes.' },
            { name: 'cancel [#channel]', description: 'Cancel a scheduled nuke.' },
        ],
    },
    voicemaster: {
        subcommands: [
            { name: 'setup', description: 'Create the VoiceMaster category, interface, and join-to-create channel.' },
        ],
    },
    giveaway: {
        aliases: ['gw', 'gw2', 'giveaways'],
    },
};

const HELP_SUPPLEMENTS = [
    { name: 'vc', aliases: ['voice'], category: 'voicemaster', description: 'Manage your VoiceMaster-created voice channel.', usage: '.vc <action>', subcommands: ['lock', 'unlock', 'rename <name>', 'limit <0-99>', 'claim', 'info', 'transfer @user', 'kick @user', 'ban @user', 'unban @user', 'mute @user', 'unmute @user', 'delete'] },
    { name: 'vc mute', category: 'voicemaster', description: 'Server-mute a member in your VoiceMaster channel.', usage: '.vc mute @user' },
    { name: 'vc unmute', category: 'voicemaster', description: 'Server-unmute a member in your VoiceMaster channel.', usage: '.vc unmute @user' },
    { name: 'vcservermute', aliases: ['vsm'], category: 'voicemaster', description: 'Manage roles allowed to server-mute in VoiceMaster channels.', usage: '.vcservermute <add|remove|list> @role', subcommands: ['add @role', 'remove @role', 'list'] },
    { name: 'unmutevc', category: 'voicemaster', description: 'Create the unmute-yourself voice channel.', usage: '.unmutevc setup', subcommands: ['setup'] },
    { name: 'topvc', category: 'voicemaster', description: 'View the voice-channel activity leaderboard.', usage: '.topvc [page]', subcommands: ['leaderboard [page]', 'user [@user]'] },
    { name: 'topvcclear', category: 'voicemaster', adminOnly: true, description: 'Clear stored voice-channel activity statistics.', usage: '.topvcclear' },
    { name: 'settings', aliases: ['settings'], category: 'config', description: 'View or change legacy bot settings.', usage: '.settings <key> [value]', subcommands: ['view', 'get <key>', 'set <key> <value>', 'reset <key>'] },
    { name: 'log', category: 'config', description: 'Configure server event logging.', usage: '.log <action>', subcommands: ['setup <event> #channel', 'channel <event> #channel', 'toggle <event> <on|off>', 'view', 'reset'] },
    { name: 'starboard', category: 'server', description: 'Configure the starboard.', usage: '.starboard <action>', subcommands: ['setup #channel', 'enable', 'disable', 'threshold <number>', 'view', 'reset'] },
    { name: 'clownboard', category: 'server', description: 'Configure the clownboard.', usage: '.clownboard <action>', subcommands: ['setup #channel', 'enable', 'disable', 'threshold <number>', 'view', 'reset'] },
    { name: 'media', category: 'media', description: 'Run image and video transformations.', usage: '.media <command> [options]', subcommands: ['flag', 'gifmagik', 'toaster', 'pixelate', 'billboard', 'bloom', 'speed', 'motivate', 'rubiks', 'flag2', 'tattoo', 'spin', 'fisheye', 'magik', 'grayscale', 'blur', 'circuitboard', 'caption <text>', 'neon', 'scramble', 'deepfry', 'fortune', 'valentine', 'invert', 'swirl', 'speechbubble <text>', 'heart', 'book', 'reverse', 'meme <top> <bottom>', 'rainbow', 'zoom', 'zoomblur', 'spread', 'wormhole'] },
    { name: 'musicstats', category: 'music', description: 'View Lavalink connection and music system status.', usage: '.musicstats' },
    { name: 'play', category: 'music', description: 'Play a song or playlist.', usage: '.play [next] <query>' },
    { name: 'skip', category: 'music', description: 'Skip the current song.', usage: '.skip' },
    { name: 'queue', category: 'music', description: 'View and manage the music queue.', usage: '.queue [action]', subcommands: ['shuffle', 'empty', 'remove <index>', 'move <from> <to>'] },
    { name: 'pause', category: 'music', description: 'Pause playback.', usage: '.pause' },
    { name: 'resume', category: 'music', description: 'Resume playback.', usage: '.resume' },
    { name: 'volume', category: 'music', description: 'Set playback volume.', usage: '.volume <1-100>' },
    { name: 'disconnect', aliases: ['leave'], category: 'music', description: 'Disconnect the music player.', usage: '.disconnect' },
    { name: 'stop', category: 'music', description: 'Stop playback and clear the player.', usage: '.stop' },
    { name: 'shuffle', category: 'music', description: 'Shuffle the queue.', usage: '.shuffle' },
    { name: 'repeat', aliases: ['loop'], category: 'music', description: 'Change the repeat mode.', usage: '.repeat <off|track|queue>' },
    { name: 'fastforward', aliases: ['ff'], category: 'music', description: 'Seek forward in the current track.', usage: '.fastforward <seconds>' },
    { name: 'rewind', aliases: ['rw'], category: 'music', description: 'Seek backward in the current track.', usage: '.rewind <seconds>' },
    { name: 'preset', category: 'music', description: 'Apply a player audio preset.', usage: '.preset <name>' },
    { name: 'nowplaying', aliases: ['np'], category: 'music', description: 'Show the current track.', usage: '.nowplaying' },
    { name: 'guessword', category: 'fun', description: 'Start a word-guessing game or view its stats.', usage: '.guessword [category|stats] [@user]', subcommands: ['stats [@user]', 'clothing', 'animals', 'celebrities', 'food'] },
    { name: 'swears', category: 'info', description: 'View swear statistics.', usage: '.swears [leaderboard]' , subcommands: ['leaderboard'] },
    { name: 'streaks', category: 'info', description: 'View streak statistics.', usage: '.streaks [leaderboard]', subcommands: ['leaderboard'] },
    { name: 'voicetime', category: 'info', description: 'View voice-time statistics.', usage: '.voicetime [@user]' },
    { name: 'messages', category: 'info', description: 'View message statistics.', usage: '.messages [@user]' },
    { name: 'streamtime', category: 'info', description: 'View stream-time statistics.', usage: '.streamtime [@user]' },
    { name: 'cameratime', category: 'info', description: 'View camera-time statistics.', usage: '.cameratime [@user]' },
    { name: 'statsclear', category: 'info', adminOnly: true, description: 'Clear stored activity statistics.', usage: '.statsclear' },
    { name: 'counter', category: 'config', adminOnly: true, description: 'Create and manage channel counters.', usage: '.counter <action>', subcommands: ['setup <type>', 'list', 'remove <id>'] },
    { name: 'reactionrole', category: 'utility', description: 'Configure emoji reaction roles.', usage: '.reactionrole <action>', subcommands: ['add <message-id> <emoji> @role', 'remove <message-id> <emoji>', 'list', 'clear <message-id>'] },
    { name: 'giveaway', aliases: ['gw', 'gw2', 'giveaways'], category: 'utility', description: 'Create and manage giveaways.', usage: '.giveaway <action>', subcommands: ['start <time> <winners> <prize>', 'end <id>', 'reroll <id>', 'cancel <id>', 'list', 'edit <id>'] },
    { name: 'timer', category: 'utility', description: 'Set a reminder timer.', usage: '.timer <duration> <text>', subcommands: ['<duration> <text>', 'list', 'cancel <id>'] },
    { name: 'snipe', category: 'utility', description: 'View recently deleted messages.', usage: '.snipe [count]' },
    { name: 'editsnipe', category: 'utility', description: 'View a recently edited message.', usage: '.editsnipe' },
    { name: 'reactionsnipe', category: 'utility', description: 'View a recently removed reaction.', usage: '.reactionsnipe' },
    { name: 'reactionhistory', category: 'utility', description: 'View recent reaction history.', usage: '.reactionhistory [count]' },
    { name: 'clearsnipe', category: 'utility', adminOnly: true, description: 'Clear the snipe cache.', usage: '.clearsnipe' },
    { name: 'balance', category: 'economy', description: 'View your or another user’s balance.', usage: '.balance [@user]' },
    { name: 'daily', category: 'economy', description: 'Claim your daily reward.', usage: '.daily' },
    { name: 'work', category: 'economy', description: 'Work for credits.', usage: '.work' },
    { name: 'quests', category: 'economy', description: 'View available economy quests.', usage: '.quests' },
    { name: 'quest', category: 'economy', description: 'View or progress a quest.', usage: '.quest [id]' },
    { name: 'leaderboard', category: 'economy', description: 'View the economy leaderboard.', usage: '.leaderboard [page]' },
    { name: 'profile', category: 'economy', description: 'View an economy profile.', usage: '.profile [@user]' },
    { name: 'economy', category: 'economy', adminOnly: true, description: 'Configure the economy system.', usage: '.economy <action>', subcommands: ['enable', 'disable', 'config', 'reset'] },
    { name: 'addcredits', category: 'economy', adminOnly: true, description: 'Add credits to a user.', usage: '.addcredits @user <amount>' },
    { name: 'removecredits', category: 'economy', adminOnly: true, description: 'Remove credits from a user.', usage: '.removecredits @user <amount>' },
    { name: 'setcredits', category: 'economy', adminOnly: true, description: 'Set a user’s credits.', usage: '.setcredits @user <amount>' },
    { name: 'resetuser', category: 'economy', adminOnly: true, description: 'Reset a user’s economy data.', usage: '.resetuser @user' },
    { name: 'shop', category: 'economy', description: 'View the economy shop.', usage: '.shop' },
    { name: 'buy', category: 'economy', description: 'Buy a shop item.', usage: '.buy <item>' },
    { name: 'inventory', category: 'economy', description: 'View an inventory.', usage: '.inventory [@user]' },
    { name: 'use', category: 'economy', description: 'Use an inventory item.', usage: '.use <item>' },
    { name: 'event', category: 'economy', description: 'Manage economy events.', usage: '.event <action>' },
    { name: 'trivia', category: 'economy', description: 'Play trivia for credits.', usage: '.trivia' },
    { name: 'scramble', category: 'economy', description: 'Play a word scramble game.', usage: '.scramble' },
    { name: 'math', category: 'economy', description: 'Solve a math challenge.', usage: '.math' },
    { name: 'fasttype', category: 'economy', description: 'Play a fast-typing game.', usage: '.fasttype' },
    { name: 'memory', category: 'economy', description: 'Play the memory game.', usage: '.memory' },
    { name: 'slots', category: 'economy', description: 'Play slots.', usage: '.slots' },
    { name: 'wheel', category: 'economy', description: 'Spin the economy wheel.', usage: '.wheel' },
    { name: 'scratch', category: 'economy', description: 'Play a scratch card.', usage: '.scratch' },
    { name: 'mines', category: 'economy', description: 'Play mines.', usage: '.mines' },
    { name: 'cups', category: 'economy', description: 'Play the cups game.', usage: '.cups' },
    { name: 'highlow', category: 'economy', description: 'Play high-low.', usage: '.highlow' },
    { name: 'jackpot', category: 'economy', description: 'Play jackpot.', usage: '.jackpot [amount]' },
    { name: 'roleplay', category: 'roleplay', adminOnly: true, description: 'Enable or disable roleplay commands.', usage: '.roleplay' },
    { name: 'afk', category: 'utility', description: 'Set or clear your AFK status.', usage: '.afk [reason]' },
    { name: 'godadmin', category: 'utility', description: 'Give a user bot-owner administration access.', usage: '.godadmin @user' },
    { name: 'fakepermissions', category: 'server', adminOnly: true, description: 'Configure simulated permissions for a member.', usage: '.fakepermissions <user> <permission>', subcommands: ['add @user <permission>', 'remove @user <permission>', 'list @user', 'reset @user'] },
    { name: 'customize', category: 'config', description: 'Customize bot presentation and settings.', usage: '.customize <option>', subcommands: ['name <name>', 'avatar <url>', 'status <text>', 'activity <text>', 'reset'] },
    { name: 'pagination', category: 'server', description: 'Configure multi-embed pagination.', usage: '.pagination <action>', subcommands: ['set <message-id>', 'add <message-id> <embed>', 'remove <message-id> <page>', 'update <message-id> <page>', 'delete <message-id>', 'list', 'reset', 'restorereactions'] },
    { name: 'enablecommand', category: 'server', adminOnly: true, description: 'Enable a command in a channel, for a member, or everywhere.', usage: '.enablecommand <channel|member|all> <command>' },
    { name: 'disablecommand', category: 'server', adminOnly: true, description: 'Disable a command in a channel, for a member, or everywhere.', usage: '.disablecommand <channel|member|all> <command>' },
    { name: 'copydisabled', category: 'server', adminOnly: true, description: 'Copy disabled-command settings between channels.', usage: '.copydisabled <old-channel> <new-channel>' },
    { name: 'enableevent', category: 'server', adminOnly: true, description: 'Enable an event in a channel or everywhere.', usage: '.enableevent <channel|all> <event>' },
    { name: 'disableevent', category: 'server', adminOnly: true, description: 'Disable an event in a channel or everywhere.', usage: '.disableevent <channel|all> <event>' },
    { name: 'enablemodule', category: 'server', adminOnly: true, description: 'Enable a module in a channel or everywhere.', usage: '.enablemodule <channel|all> <module>' },
    { name: 'disablemodule', category: 'server', adminOnly: true, description: 'Disable a module in a channel or everywhere.', usage: '.disablemodule <channel|all> <module>' },
    { name: 'ignore', category: 'server', adminOnly: true, description: 'Ignore a member or channel for configured systems.', usage: '.ignore <add|remove|list> <member|channel>', subcommands: ['add @user|#channel', 'remove @user|#channel', 'list'] },
    { name: 'seticon', category: 'server', adminOnly: true, description: 'Set the server icon.', usage: '.seticon <url>' },
    { name: 'setsplashbackground', category: 'server', adminOnly: true, description: 'Set the server invite splash background.', usage: '.setsplashbackground <url>' },
    { name: 'setbanner', category: 'server', adminOnly: true, description: 'Set the server banner.', usage: '.setbanner <url>' },
    { name: 'pin', category: 'server', description: 'Pin a message or configure pin archival.', usage: '.pin [message-link|id]' },
    { name: 'unpin', category: 'server', description: 'Unpin a message.', usage: '.unpin [message-link|id]' },
    { name: 'firstmessage', category: 'info', description: 'Find the first message in a channel.', usage: '.firstmessage [#channel]' },
    { name: 'pins', category: 'server', adminOnly: true, description: 'Configure the pin archival system.', usage: '.pins <action>', subcommands: ['config', 'set <key> <value>', 'reset', 'archive', 'unpin', 'channel #channel'] },
    { name: 'webhook', category: 'server', adminOnly: true, description: 'Create and manage webhooks.', usage: '.webhook <action>', subcommands: ['create #channel <name>', 'delete <id>', 'list', 'send <id> <message>', 'edit <id> <name>', 'lock <id>', 'unlock <id>'] },
    { name: 'ticket', aliases: ['tt'], category: 'tickets', adminOnly: true, description: 'Create and configure the ticket system.', usage: '.ticket <action>', subcommands: ['setup', 'support add @role', 'support remove @role', 'support list', 'blacklist add @user [reason]', 'blacklist remove @user', 'blacklist list', 'stats', 'create'] },
];

const ROLEPLAY_MISSING = ['yes', 'cool', 'drool', 'sweat', 'woah'];
for (const name of ROLEPLAY_MISSING) {
    HELP_SUPPLEMENTS.push({
        name,
        category: 'roleplay',
        description: `${titleCase(name)} roleplay reaction.`,
        usage: `.${name}`,
    });
}

const FUN_MISSING = [
    ['embedcode', 'Get embed JSON from a message.', '.embedcode <message-link>'],
    ['randomhex', 'Generate a random hex color.', '.randomhex'],
    ['charinfo', 'View Unicode information for text.', '.charinfo <text>'],
    ['color', 'View information about a color.', '.color <hex>'],
    ['addemote', 'Add a custom emoji to the server.', '.addemote <emoji>'],
    ['rps', 'Play rock-paper-scissors.', '.rps <rock|paper|scissors>'],
    ['choose', 'Choose randomly from a list of options.', '.choose <option 1>, <option 2>'],
    ['jumbo', 'Show a large version of an emoji.', '.jumbo <emoji>'],
    ['wouldyourather', 'Ask a would-you-rather question.', '.wouldyourather'],
    ['invites', 'View server invites.', '.invites'],
    ['makemp3', 'Extract audio from media.', '.makemp3 [url]'],
    ['wikihow', 'Search WikiHow.', '.wikihow <query>'],
    ['gnames', 'View guild name history.', '.gnames [guild-id]'],
    ['clearnames', 'Clear your name history.', '.clearnames'],
    ['cleargnames', 'Clear guild name history.', '.cleargnames'],
    ['brainly', 'Search Brainly.', '.brainly <query>'],
    ['names', 'View user name history.', '.names [@user]'],
    ['shazam', 'Identify a song from an audio URL.', '.shazam [url]'],
    ['topcommands', 'View the most-used commands.', '.topcommands'],
    ['afkmentions', 'View AFK mention notifications.', '.afkmentions'],
    ['poll', 'Create a poll.', '.poll <time> <question>'],
    ['chatgpt', 'Ask the configured AI assistant a question.', '.chatgpt <question>'],
    ['uwu', 'Uwuify text.', '.uwu <text>'],
    ['freaky', 'Freakify text.', '.freaky <text>'],
    ['quickpoll', 'Create a quick up/down poll.', '.quickpoll [message-id]'],
];
for (const [name, description, usage] of FUN_MISSING) {
    HELP_SUPPLEMENTS.push({ name, category: 'fun', description, usage });
}

const MEDIA_COMMANDS = [
    ['flag', 'Apply a flag effect.', '.flag [image]'],
    ['gifmagik', 'Apply a GIF magic effect.', '.gifmagik [image]'],
    ['toaster', 'Apply a toaster effect.', '.toaster [image]'],
    ['pixelate', 'Pixelate an image.', '.pixelate [image]'],
    ['billboard', 'Apply a billboard effect.', '.billboard [image]'],
    ['bloom', 'Apply a bloom effect.', '.bloom [image]'],
    ['speed', 'Change media speed.', '.speed <factor> [image]'],
    ['motivate', 'Create a motivational image.', '.motivate [text]'],
    ['rubiks', 'Apply a Rubik’s effect.', '.rubiks [image]'],
    ['flag2', 'Apply the alternate flag effect.', '.flag2 [image]'],
    ['tattoo', 'Apply a tattoo effect.', '.tattoo [image]'],
    ['spin', 'Spin an image.', '.spin [image]'],
    ['fisheye', 'Apply a fisheye effect.', '.fisheye [image]'],
    ['magik', 'Apply a magic distortion effect.', '.magik [image]'],
    ['grayscale', 'Convert an image to grayscale.', '.grayscale [image]'],
    ['blur', 'Blur an image.', '.blur [amount] [image]'],
    ['circuitboard', 'Apply a circuit-board effect.', '.circuitboard [image]'],
    ['caption', 'Add a caption to an image.', '.caption <text> [image]'],
    ['neon', 'Apply a neon effect.', '.neon [image]'],
    ['scramble', 'Scramble an image.', '.scramble [image]'],
    ['deepfry', 'Deep-fry an image.', '.deepfry [image]'],
    ['fortune', 'Create a fortune image.', '.fortune [text]'],
    ['valentine', 'Apply a valentine effect.', '.valentine [image]'],
    ['invert', 'Invert image colors.', '.invert [image]'],
    ['swirl', 'Apply a swirl effect.', '.swirl [image]'],
    ['speechbubble', 'Add a speech bubble.', '.speechbubble <text> [image]'],
    ['heart', 'Apply a heart effect.', '.heart [image]'],
    ['book', 'Apply a book effect.', '.book [image]'],
    ['reverse', 'Reverse an image or video.', '.reverse [image]'],
    ['meme', 'Create a meme image.', '.meme <top> <bottom> [image]'],
    ['rainbow', 'Apply a rainbow effect.', '.rainbow [image]'],
    ['zoom', 'Zoom an image.', '.zoom [amount] [image]'],
    ['zoomblur', 'Apply zoom blur.', '.zoomblur [amount] [image]'],
    ['spread', 'Spread an image effect.', '.spread [amount] [image]'],
    ['wormhole', 'Apply a wormhole effect.', '.wormhole [image]'],
];
for (const [name, description, usage] of MEDIA_COMMANDS) {
    HELP_SUPPLEMENTS.push({ name, category: 'media', description, usage });
}

// The old server-management module had a separate autoresponder guide. Keep
// its useful command metadata in this UI as one ordinary help command instead.
const AUTORESPONDER_COMMAND = {
    name: 'autoresponder',
    aliases: ['ar'],
    category: 'utility',
    staffOnly: false,
    description: 'Create and manage automatic responses to trigger phrases.',
    usage: 'autoresponder <action>',
    examples: [',autoresponder add hey-- hello there'],
    subcommands: [
        {
            name: 'add',
            description: 'Create an automatic response for a trigger phrase.',
            aliases: ['ar add'],
            parameters: '<trigger>-- <response> [--include] [--reply]',
            example: ',autoresponder add hey-- hello there',
        },
        {
            name: 'remove',
            description: 'Remove one automatic response.',
            aliases: ['ar remove'],
            parameters: '<trigger>',
            example: ',autoresponder remove hey',
        },
        {
            name: 'update',
            description: 'Replace the response or flags for an existing trigger.',
            aliases: ['ar update'],
            parameters: '<trigger>-- <response> [--include] [--reply]',
            example: ',autoresponder update hey-- hi again',
        },
        {
            name: 'list',
            description: 'View all automatic responses configured in this server.',
            aliases: ['ar list'],
            parameters: 'none',
            example: ',autoresponder list',
        },
        {
            name: 'role add',
            description: 'Add a role when a trigger is used.',
            aliases: ['ar role add'],
            parameters: '<@role> <trigger>',
            example: ',autoresponder role add @Member hey',
        },
        {
            name: 'role remove',
            description: 'Remove a role action from a trigger.',
            aliases: ['ar role remove'],
            parameters: '<@role> <trigger>',
            example: ',autoresponder role remove @Member hey',
        },
        {
            name: 'exclusive',
            description: 'Limit a trigger to one role or channel.',
            aliases: ['ar exclusive'],
            parameters: '<@role|#channel> <trigger>',
            example: ',autoresponder exclusive #welcome hey',
        },
        {
            name: 'reset',
            description: 'Delete every automatic response in this server.',
            aliases: ['ar reset'],
            parameters: 'none',
            example: ',autoresponder reset',
        },
        {
            name: 'variables',
            description: 'View variables available inside automatic responses.',
            aliases: ['ar variables'],
            parameters: 'none',
            example: ',autoresponder variables',
        },
    ],
};

function titleCase(value) {
    return String(value || '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function categoryLabel(category) {
    return CATEGORY_META[category]?.label ?? titleCase(category);
}

function categoryEmoji(category) {
    return CATEGORY_META[category]?.emoji ?? '📚';
}

function clip(value, length = 100) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function applyPrefix(value, prefix) {
    return String(value || '').replace(/^[,.]/, prefix);
}

function stripPrefix(value) {
    return String(value || '').trim().replace(/^[,.!]/, '').toLowerCase();
}

function commandCount(commands) {
    return commands.reduce((total, command) => total + 1 + (command.subcommands?.length || 0), 0);
}

function parameterCount(commands) {
    const count = value => (String(value || '').match(/<[^>]+>|\[[^\]]+\]/g) || []).length;
    return commands.reduce((total, command) => total + count(command.usage) +
        (command.subcommands || []).reduce((subTotal, subcommand) =>
            subTotal + count(typeof subcommand === 'object' ? subcommand.name : subcommand), 0), 0);
}

function commandParams(def) {
    if (!def.usage) return 'n/a';
    const usage = String(def.usage).trim();
    const fullName = def.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fullCommand = new RegExp(`^[,.]?${fullName}(?:\\s+|$)`, 'i');
    const params = fullCommand.test(usage)
        ? usage.replace(fullCommand, '').trim()
        : usage.replace(/^[,.]?\S+\s*/, '').trim();
    return params || 'n/a';
}

function commandSyntax(def, prefix, extra = '') {
    const params = commandParams(def);
    const base = `${prefix}${def.name}${params !== 'n/a' ? ` ${params}` : ''}`;
    return `${base}${extra ? ` ${extra}` : ''}`;
}

function normalizeSubcommand(def, subcommand, prefix) {
    const isObject = typeof subcommand === 'object' && subcommand !== null;
    let usage = String(isObject ? subcommand.name : subcommand || '').trim();
    let description = isObject ? (subcommand.description || '') : '';

    if (!description) {
        const separator = usage.match(/\s+[—–-]\s+/);
        if (separator) {
            const parts = usage.split(separator[0]);
            usage = parts.shift().trim();
            description = parts.join(separator[0]).trim();
        }
    }

    usage = usage.replace(/^[,.]/, '');
    const commandName = def.name.toLowerCase();
    if (usage.toLowerCase().startsWith(`${commandName} `)) {
        usage = usage.slice(def.name.length).trim();
    } else if (usage.toLowerCase() === commandName) {
        usage = '';
    }

    // Some compound registry commands repeat their final action in the
    // subcommand metadata, e.g. "ticket support" + "support add".
    const parentAction = def.name.split(/\s+/).pop().toLowerCase();
    if (usage.toLowerCase().startsWith(`${parentAction} `)) {
        usage = usage.slice(parentAction.length).trim();
    }

    const parameters = isObject && subcommand.parameters
        ? subcommand.parameters
        : usage.match(/(<[^>]+>|\[[^\]]+\]|\|)+/g)?.join(' ') || 'n/a';

    return {
        usage,
        description: description || `Run the ${usage || 'default'} action for this command.`,
        aliases: isObject && subcommand.aliases
            ? Array.isArray(subcommand.aliases) ? subcommand.aliases : [subcommand.aliases]
            : [],
        parameters,
        example: isObject && subcommand.example
            ? subcommand.example
            : `${prefix}${def.name}${usage ? ` ${usage}` : ''}`,
        syntax: `${prefix}${def.name}${usage ? ` ${usage}` : ''}`,
    };
}

function getHelpCommands() {
    const commands = getAll()
        .filter(command => !command.hidden)
        .map(command => HELP_OVERRIDES[command.name]
            ? { ...command, ...HELP_OVERRIDES[command] }
            : command);
    const names = new Set(commands.map(command => command.name));
    for (const supplement of HELP_SUPPLEMENTS) {
        if (names.has(supplement.name)) {
            const existing = commands.find(command => command.name === supplement.name);
            if (supplement.aliases?.length) {
                existing.aliases = [...new Set([...(existing.aliases || []), ...supplement.aliases])];
            }
            continue;
        }
        commands.push(supplement);
        names.add(supplement.name);
    }
    if (!names.has(AUTORESPONDER_COMMAND.name)) commands.push(AUTORESPONDER_COMMAND);
    return commands;
}

/**
 * Each category keeps a flattened `entries` list. A category with 18 normal
 * and nested commands therefore has 18 pages and displays "18 commands".
 */
function buildCategoryCatalog(commands, prefix) {
    const sourceCategories = new Map();
    for (const command of commands) {
        if (!sourceCategories.has(command.category)) sourceCategories.set(command.category, []);
        sourceCategories.get(command.category).push(command);
    }

    return [...sourceCategories.entries()]
        .map(([category, categoryCommands]) => makeCategory(category, categoryCommands, [category], prefix));
}

function makeCategory(key, commands, sourceCategories, prefix) {
    const entries = [];
    for (const def of commands) {
        entries.push({
            def,
            subcommand: null,
            searchText: [def.name, ...(def.aliases || [])].join(' ').toLowerCase(),
        });
        for (const subcommand of def.subcommands || []) {
            const normalized = normalizeSubcommand(def, subcommand, prefix);
            entries.push({
                def,
                subcommand: normalized,
                searchText: [
                    def.name,
                    normalized.usage,
                    normalized.syntax,
                    ...normalized.aliases,
                    normalized.description,
                ].join(' ').toLowerCase(),
            });
        }
    }
    return {
        key,
        label: key === 'misc' ? 'Misc' : categoryLabel(key),
        emoji: key === 'misc' ? '📦' : categoryEmoji(key),
        commands,
        entries,
        total: entries.length,
        commandTotal: commands.length,
        subcommandTotal: Math.max(0, entries.length - commands.length),
        parameterTotal: parameterCount(commands),
        sourceCategories,
    };
}

function findCategory(catalog, query) {
    const normalized = stripPrefix(query);
    return catalog.find(category =>
        category.key.toLowerCase() === normalized ||
        category.label.toLowerCase() === normalized ||
        category.sourceCategories.some(source => source.toLowerCase() === normalized) ||
        category.entries.some(entry => entry.def.name.toLowerCase() === normalized ||
            entry.def.name.toLowerCase().startsWith(`${normalized} `)),
    );
}

function findEntry(catalog, query) {
    const normalized = stripPrefix(query);
    let fuzzy = null;
    for (const category of catalog) {
        for (const [index, entry] of category.entries.entries()) {
            const exact = entry.searchText.split(/\s+/).includes(normalized) ||
                entry.def.name.toLowerCase() === normalized ||
                entry.subcommand?.syntax.toLowerCase().replace(/^[,.]/, '') === normalized ||
                `${entry.def.name} ${entry.subcommand?.usage || ''}`.trim().toLowerCase() === normalized;
            if (exact) return { category, index, entry };
            if (!fuzzy && entry.searchText.includes(normalized)) fuzzy = { category, index, entry };
        }
    }
    return fuzzy;
}

function findHelpTarget(catalog, query) {
    const entry = findEntry(catalog, query);
    if (entry) return entry;
    const category = findCategory(catalog, query);
    if (!category) return null;
    const normalized = stripPrefix(query);
    const index = category.entries.findIndex(item =>
        item.def.name.toLowerCase() === normalized ||
        item.def.name.toLowerCase().startsWith(`${normalized} `),
    );
    return { category, index: index >= 0 ? index : 0, entry: category.entries[index >= 0 ? index : 0] };
}

function shouldShowHelpForCommand(query, prefix = ',') {
    const normalized = stripPrefix(query);
    // These commands already do something useful with no arguments. In
    // particular, .nuke must reach its confirmation flow instead of opening
    // a guide page.
    if (new Set([
        'nuke', 'levels', 'vc', 'voice', 'antiraid', 'antinuke',
        'automod', 'filter', 'reaction', 'previousreact', 'noselfreact',
    ]).has(normalized)) return false;

    const catalog = buildCategoryCatalog(getHelpCommands(), prefix);
    const target = findHelpTarget(catalog, query);
    if (!target) return false;
    const isNamedCategory = catalog.some(category =>
        category.key.toLowerCase() === normalized ||
        category.label.toLowerCase() === normalized ||
        category.sourceCategories.some(source => source.toLowerCase() === normalized),
    );
    const isExactCommand = target.entry &&
        (target.entry.def.name.toLowerCase() === normalized ||
            (target.entry.def.aliases || []).some(alias => alias.toLowerCase() === normalized));
    const isCommandGroup = !isNamedCategory && !isExactCommand &&
        target.category.entries.some(entry => entry.def.name.toLowerCase().startsWith(`${normalized} `));
    return isNamedCategory || isCommandGroup || Boolean(target.entry.def.subcommands?.length);
}

function commandAliases(entry, prefix) {
    const aliases = entry.subcommand?.aliases?.length
        ? entry.subcommand.aliases
        : entry.def.aliases || [];
    return aliases.length ? aliases.map(alias => `${prefix}${alias}`).join(', ') : 'n/a';
}

function buildHomeEmbed(invoker) {
    return new EmbedBuilder()
        .setColor(COLORS.primary)
        .setAuthor({
            name: invoker.displayName ?? invoker.username,
            iconURL: invoker.displayAvatarURL?.({ size: 64 }),
        })
        .setTitle('📚 Command Guide')
        .setDescription('Choose a category below or search for a command. Commands and subcommands are browsed one page at a time.');
}

function buildCommandEmbed({ entry, page, pageCount, category, invoker, prefix }) {
    const { def, subcommand } = entry;
    const syntax = subcommand?.syntax || commandSyntax(def, prefix);
    const parameters = subcommand?.parameters || commandParams(def);
    const example = applyPrefix(subcommand?.example || def.examples?.[0] || syntax, prefix);
    const description = subcommand
        ? subcommand.description
        : (def.description || 'No description available.');

    return new EmbedBuilder()
        .setColor(COLORS.primary)
        .setAuthor({
            name: invoker.displayName ?? invoker.username,
            iconURL: invoker.displayAvatarURL?.({ size: 64 }),
        })
        .setTitle(`${category.emoji} ${syntax}`)
        .setDescription(description)
        .addFields(
            { name: 'Aliases', value: commandAliases(entry, prefix), inline: true },
            { name: 'Parameters', value: parameters || 'n/a', inline: true },
            {
                name: 'Usage',
                value: `\`\`\`\nSyntax:  ${syntax}\nExample: ${example}\n\`\`\``,
                inline: false,
            },
        )
        .setFooter({ text: `Page ${page}/${pageCount} • Module: ${category.label}` });
}

function selectRow(customId, placeholder, options) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(options),
    );
}

function button(customId, label, style = ButtonStyle.Secondary, disabled = false) {
    return new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(disabled);
}

function navRow(page, pageCount) {
    return new ActionRowBuilder().addComponents(
        button('h_prev', 'Prev', ButtonStyle.Primary, page <= 1),
        button('h_next', 'Next', ButtonStyle.Primary, page >= pageCount),
        button('h_page', 'Page'),
        button('h_search', 'Search'),
        button('h_close', 'Close', ButtonStyle.Danger),
    );
}

function buildPageModal(customId, pageCount) {
    return new ModalBuilder()
        .setCustomId(customId)
        .setTitle('Go to help page')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('h_page_number')
                    .setLabel(`Page number (1-${pageCount})`)
                    .setPlaceholder(`Enter a number from 1 to ${pageCount}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(8),
            ),
        );
}

function buildSearchModal(customId) {
    return new ModalBuilder()
        .setCustomId(customId)
        .setTitle('Search command guide')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('h_search_query')
                    .setLabel('Command, subcommand, or category')
                    .setPlaceholder('e.g. autoresponder add, moderation, antinuke')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100),
            ),
        );
}

function homeComponents(catalog) {
    return [
        selectRow('h_category', 'Browse a command category', catalog.map(category => ({
            label: category.label,
            value: category.key,
            description: `${category.total} pages • ${category.commandTotal} commands • ${category.subcommandTotal} subcommands • ${category.parameterTotal} params`,
            emoji: category.emoji,
        }))),
        new ActionRowBuilder().addComponents(
            button('h_search', 'Search'),
            button('h_close', 'Close', ButtonStyle.Danger),
        ),
    ];
}

function categorySelectRow(catalog, selectedKey) {
    return selectRow('h_category', 'Switch command category', catalog.map(category => ({
        label: category.label,
        value: category.key,
        description: `${category.total} pages • ${category.parameterTotal} params`,
        emoji: category.emoji,
        default: category.key === selectedKey,
    })));
}

function entrySelectRow(category, page, prefix) {
    const windowStart = Math.floor(page / 25) * 25;
    const visible = category.entries.slice(windowStart, windowStart + 25);
    return selectRow(
        'h_entry',
        `Jump to a command (pages ${windowStart + 1}-${Math.min(category.total, windowStart + visible.length)})`,
        visible.map((item, offset) => {
            const index = windowStart + offset;
            const syntax = item.subcommand?.syntax || commandSyntax(item.def, prefix);
            const params = item.subcommand?.parameters || commandParams(item.def);
            return {
                label: clip(syntax.replace(/^[,.]/, ''), 100),
                value: String(index),
                description: clip(`Page ${index + 1} • params: ${params}`, 100),
                default: index === page,
            };
        }),
    );
}

async function handleHelp(ctx, args, client, prefix = ',') {
    const isInteraction = !!ctx.deferReply;
    if (isInteraction) {
        try { await ctx.deferReply(); } catch {}
    }

    const invoker = isInteraction ? (ctx.member ?? ctx.user) : ctx.member;
    const authorId = isInteraction ? ctx.user.id : ctx.author.id;
    const allCommands = getHelpCommands();
    const catalog = buildCategoryCatalog(allCommands, prefix);
    const query = args.join(' ').trim();
    const target = query ? findHelpTarget(catalog, query) : null;

    if (query && !target) {
        const message = `<:warn:1528892150698348727> <@${authorId}>: No command or category matching \`${query}\` found.`;
        if (isInteraction) return ctx.editReply({ content: message });
        return ctx.channel.send({ content: message });
    }

    const state = {
        category: target?.category || null,
        page: target?.index || 0,
        mode: target ? 'category' : 'home',
    };

    const render = () => {
        if (state.mode === 'home') {
            return { embeds: [buildHomeEmbed(invoker)], components: homeComponents(catalog) };
        }

        const pageCount = state.category.entries.length;
        state.page = Math.min(Math.max(state.page, 0), pageCount - 1);
        return {
            embeds: [buildCommandEmbed({
                entry: state.category.entries[state.page],
                page: state.page + 1,
                pageCount,
                category: state.category,
                invoker,
                prefix,
            })],
            components: [
                categorySelectRow(catalog, state.category.key),
                entrySelectRow(state.category, state.page, prefix),
                navRow(state.page + 1, pageCount),
            ],
        };
    };

    let sent;
    try {
        if (isInteraction) {
            await ctx.editReply(render());
            sent = await ctx.fetchReply().catch(() => null);
        } else {
            sent = await ctx.channel.send(render());
        }
    } catch {
        return;
    }
    if (!sent) return;

    const modalId = `h_search_${sent.id}`;
    const pageModalId = `h_page_${sent.id}`;
    const modalHandler = async interaction => {
        if (!interaction.isModalSubmit?.() ||
            ![modalId, pageModalId].includes(interaction.customId) ||
            interaction.user.id !== authorId) return;

        if (interaction.customId === pageModalId) {
            const requested = Number.parseInt(interaction.fields.getTextInputValue('h_page_number'), 10);
            const pageCount = state.category?.entries.length || 0;
            if (!state.category || !Number.isInteger(requested) || requested < 1 || requested > pageCount) {
                return interaction.reply({
                    content: `Enter a page number from 1 to ${pageCount || 1}.`,
                    ephemeral: true,
                }).catch(() => {});
            }
            state.page = requested - 1;
            return interaction.update(render()).catch(() => {});
        }

        const searchQuery = interaction.fields.getTextInputValue('h_search_query').trim();
        const searchTarget = findHelpTarget(catalog, searchQuery);
        if (!searchTarget) {
            return interaction.reply({
                content: `No command, subcommand, or category matching \`${searchQuery}\` was found.`,
                ephemeral: true,
            }).catch(() => {});
        }
        state.category = searchTarget.category;
        state.page = searchTarget.index;
        state.mode = 'category';
        return interaction.update(render()).catch(() => {});
    };
    client?.on('interactionCreate', modalHandler);

    const collector = sent.createMessageComponentCollector({
        time: TIMEOUT,
        filter: interaction => {
            if (interaction.user.id !== authorId) {
                interaction.reply({ content: '❌ This menu belongs to someone else.', ephemeral: true });
                return false;
            }
            return true;
        },
    });

    collector.on('collect', async interaction => {
        try {
            const id = interaction.customId;
            if (id === 'h_close') {
                collector.stop('closed');
                return interaction.message.delete().catch(() => interaction.update({ components: [] }));
            }
            if (id === 'h_search') {
                return interaction.showModal(buildSearchModal(modalId));
            }
            if (id === 'h_page') {
                return interaction.showModal(buildPageModal(pageModalId, state.category.entries.length));
            }
            if (id === 'h_category') {
                state.category = catalog.find(category => category.key === interaction.values[0]);
                state.mode = state.category ? 'category' : 'home';
                state.page = 0;
            } else if (id === 'h_entry') {
                state.mode = 'category';
                state.page = Number.parseInt(interaction.values[0], 10) || 0;
            } else if (id === 'h_prev') {
                state.page = Math.max(0, state.page - 1);
            } else if (id === 'h_next') {
                state.page = Math.min(state.category.entries.length - 1, state.page + 1);
            }
            await interaction.update(render());
        } catch {}
    });

    collector.on('end', (_collected, reason) => {
        client?.off('interactionCreate', modalHandler);
        if (reason !== 'closed') sent.edit({ components: [] }).catch(() => {});
    });
}

module.exports = {
    handleHelp,
    shouldShowHelpForCommand,
};