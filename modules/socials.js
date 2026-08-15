// ══════════════════════════════════════════════════════════
// SOCIALS MODULE — TikTok, Twitter, Fortnite, YouTube, Twitch,
// Roblox, CashApp, Xbox, Snapchat, Valorant, Minecraft
// ══════════════════════════════════════════════════════════

const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildDb } = require('./database');
const { isAdmin, hasDiscordPerm } = require('./helpers');
const { success: mkSuccess, error: mkError, info: mkInfo } = require('../utils/embeds');
const axios = require('axios').default;

// ── In-memory cooldowns ──
const cooldowns = new Map();
function checkCooldown(userId, command, seconds = 5) {
  const key = `${userId}:${command}`;
  const last = cooldowns.get(key);
  if (last && Date.now() - last < seconds * 1000) return false;
  cooldowns.set(key, Date.now());
  return true;
}

// ── Helper: fetch JSON ──
async function fetchJSON(url, opts = {}) {
  try {
    const { data } = await axios.get(url, { timeout: 10000, ...opts });
    return data;
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════
// TIKTOK
// ══════════════════════════════════════════════════════════

async function tiktokProfile(username) {
  // Use oEmbed for basic info + fallback
  try {
    const clean = username.replace(/^@/, '');
    const url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${clean}`;
    const data = await fetchJSON(url);
    if (!data || !data.author_name) return null;
    return {
      username: data.author_name,
      title: data.title || 'No title',
      thumbnail: data.thumbnail_url || null,
    };
  } catch { return null; }
}

async function handleTiktok(message, args) {
  const sub = args[0]?.toLowerCase();
  const db = getGuildDb(message.guild.id);

  if (sub === 'list') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const feeds = db.get('tiktokFeeds', {});
    const entries = Object.entries(feeds);
    if (!entries.length) return message.reply({ embeds: [mkInfo('TikTok Feeds', 'No feeds configured.')] });
    let desc = '';
    for (const [uname, data] of entries) {
      desc += `**@${uname}** → <#${data.channelId}>${data.message ? ` | msg: "${data.message.slice(0, 30)}..."` : ''}${data.live ? ' | 🔴 Live on' : ''}\n`;
    }
    return message.reply({ embeds: [new EmbedBuilder().setTitle('📱 TikTok Feeds').setDescription(desc).setColor('#ff0050')] });
  }

  if (sub === 'add') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const username = args[2];
    if (!channel || !username) return message.reply({ embeds: [mkError('Usage', '`,tiktok add #channel <username>`')] });
    const feeds = db.get('tiktokFeeds', {});
    feeds[username.replace(/^@/, '')] = { channelId: channel.id, message: null, live: false };
    db.set('tiktokFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Added', `TikTok **@${username}** → <#${channel.id}>`)] });
  }

  if (sub === 'remove') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const username = args[2];
    if (!channel || !username) return message.reply({ embeds: [mkError('Usage', '`,tiktok remove #channel <username>`')] });
    const feeds = db.get('tiktokFeeds', {});
    delete feeds[username.replace(/^@/, '')];
    db.set('tiktokFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Removed', `Removed **@${username}** from <#${channel.id}>`)] });
  }

  if (sub === 'message') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const username = args[1];
    const msg = args.slice(2).join(' ');
    if (!username) return message.reply({ embeds: [mkError('Usage', '`,tiktok message <username> <message>`')] });
    const feeds = db.get('tiktokFeeds', {});
    if (!feeds[username]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    if (!msg) {
      return message.reply({ embeds: [mkInfo('TikTok Message', `Current message for **@${username}**: "${feeds[username].message || 'Default'}"`)] });
    }
    feeds[username].message = msg;
    db.set('tiktokFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Message Set', `Message for **@${username}** updated.`)] });
  }

  if (sub === 'message' && args[1] === 'view') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const username = args[2];
    if (!username) return message.reply({ embeds: [mkError('Usage', '`,tiktok message view <username>`')] });
    const feeds = db.get('tiktokFeeds', {});
    if (!feeds[username]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    return message.reply({ embeds: [mkInfo('TikTok Message', `Message for **@${username}**: "${feeds[username].message || 'Default'}"`)] });
  }

  if (sub === 'live') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const username = args[1];
    const setting = args[2]?.toLowerCase();
    if (!username || !['on', 'off'].includes(setting))
      return message.reply({ embeds: [mkError('Usage', '`,tiktok live <username> <on|off>`')] });
    const feeds = db.get('tiktokFeeds', {});
    if (!feeds[username]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    feeds[username].live = setting === 'on';
    db.set('tiktokFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Live Toggle', `Live notifications for **@${username}**: **${setting.toUpperCase()}**`)] });
  }

  // Default: profile lookup
  const username = args[0] || args.join(' ');
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,tiktok <username>` or `,tiktok list/add/remove/message/live`')] });
  if (!checkCooldown(message.author.id, 'tiktok', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const profile = await tiktokProfile(username);
  if (!profile) return message.reply({ embeds: [mkError('Not Found', `Could not fetch **@${username}**. The user may not exist or TikTok is blocking requests.`)] });

  const embed = new EmbedBuilder()
    .setTitle(`📱 TikTok — @${profile.username}`)
    .setDescription(profile.title)
    .setColor('#ff0050')
    .setTimestamp();
  if (profile.thumbnail) embed.setImage(profile.thumbnail);
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// TWITTER / X
// ══════════════════════════════════════════════════════════

async function handleTwitter(message, args) {
  const sub = args[0]?.toLowerCase();
  const db = getGuildDb(message.guild.id);

  if (sub === 'list') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const feeds = db.get('twitterFeeds', {});
    const entries = Object.entries(feeds);
    if (!entries.length) return message.reply({ embeds: [mkInfo('Twitter Feeds', 'No feeds configured.')] });
    let desc = '';
    for (const [handle, data] of entries) {
      desc += `**@${handle}** → <#${data.channelId}>${data.message ? ` | msg: "${data.message.slice(0, 30)}..."` : ''}${data.retweets ? ' | 🔁 Retweets on' : ''}\n`;
    }
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🐦 Twitter Feeds').setDescription(desc).setColor('#1DA1F2')] });
  }

  if (sub === 'add') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const handle = args[2]?.replace(/^@/, '');
    if (!channel || !handle) return message.reply({ embeds: [mkError('Usage', '`,twitter add #channel <handle>`')] });
    const feeds = db.get('twitterFeeds', {});
    feeds[handle] = { channelId: channel.id, message: null, retweets: false };
    db.set('twitterFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Added', `Twitter **@${handle}** → <#${channel.id}>`)] });
  }

  if (sub === 'remove') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const handle = args[2]?.replace(/^@/, '');
    if (!channel || !handle) return message.reply({ embeds: [mkError('Usage', '`,twitter remove #channel <handle>`')] });
    const feeds = db.get('twitterFeeds', {});
    delete feeds[handle];
    db.set('twitterFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Removed', `Removed **@${handle}** from <#${channel.id}>`)] });
  }

  if (sub === 'message') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const handle = args[1]?.replace(/^@/, '');
    const msg = args.slice(2).join(' ');
    if (!handle) return message.reply({ embeds: [mkError('Usage', '`,twitter message <handle> <message>`')] });
    const feeds = db.get('twitterFeeds', {});
    if (!feeds[handle]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    if (!msg) {
      return message.reply({ embeds: [mkInfo('Twitter Message', `Current message for **@${handle}**: "${feeds[handle].message || 'Default'}"`)] });
    }
    feeds[handle].message = msg;
    db.set('twitterFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Message Set', `Message for **@${handle}** updated.`)] });
  }

  if (sub === 'message' && args[1] === 'view') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const handle = args[2]?.replace(/^@/, '');
    if (!handle) return message.reply({ embeds: [mkError('Usage', '`,twitter message view <handle>`')] });
    const feeds = db.get('twitterFeeds', {});
    if (!feeds[handle]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    return message.reply({ embeds: [mkInfo('Twitter Message', `Message for **@${handle}**: "${feeds[handle].message || 'Default'}"`)] });
  }

  if (sub === 'retweets') {
    if (!hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const handle = args[2]?.replace(/^@/, '');
    const setting = args[3]?.toLowerCase();
    if (!channel || !handle || !['on', 'off'].includes(setting))
      return message.reply({ embeds: [mkError('Usage', '`,twitter retweets #channel <handle> <on|off>`')] });
    const feeds = db.get('twitterFeeds', {});
    if (!feeds[handle]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    feeds[handle].retweets = setting === 'on';
    db.set('twitterFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Retweets Toggle', `Retweets for **@${handle}**: **${setting.toUpperCase()}**`)] });
  }

  // Default: profile lookup
  const handle = args[0]?.replace(/^@/, '') || args.join(' ');
  if (!handle) return message.reply({ embeds: [mkError('Usage', '`,twitter <handle>` or `,twitter list/add/remove/message/retweets`')] });
  if (!checkCooldown(message.author.id, 'twitter', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const embed = new EmbedBuilder()
    .setTitle(`🐦 Twitter / X — @${handle}`)
    .setDescription(`Profile lookup for **@${handle}**\n\nTwitter/X no longer offers a free public API. To enable full profile lookup, configure a Twitter API key in ",config" or use the feed system to track new posts.`)
    .setColor('#1DA1F2')
    .setURL(`https://twitter.com/${handle}`)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// FORTNITE
// ══════════════════════════════════════════════════════════

async function getFortniteShop() {
  const data = await fetchJSON('https://fortnite-api.com/v2/shop/br/combined');
  return data?.data;
}

async function searchFortniteItem(name) {
  const data = await fetchJSON(`https://fortnite-api.com/v2/cosmetics/br/search?name=${encodeURIComponent(name)}&matchMethod=contains`);
  return data?.data;
}

async function handleFortnite(message, args) {
  const sub = args[0]?.toLowerCase();
  const db = getGuildDb(message.guild.id);

  if (sub === 'shop') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !hasDiscordPerm(message.member, 'ManageChannels'))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server** or **Manage Channels**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    if (!channel) return message.reply({ embeds: [mkError('Usage', '`,fortnite shop #channel`')] });
    db.set('fortniteShopChannel', channel.id);
    return message.reply({ embeds: [mkSuccess('Shop Channel Set', `Fortnite shop updates → <#${channel.id}>`)] });
  }

  if (sub === 'shop' && args[1] === 'ping') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
    if (!role) return message.reply({ embeds: [mkError('Usage', '`,fortnite shop ping @role`')] });
    db.set('fortniteShopPingRole', role.id);
    return message.reply({ embeds: [mkSuccess('Ping Role Set', `Shop updates will ping <@&${role.id}>`)] });
  }

  if (sub === 'shop' && args[1] === 'voting') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const setting = args[2]?.toLowerCase();
    if (!['on', 'off'].includes(setting)) return message.reply({ embeds: [mkError('Usage', '`,fortnite shop voting <on|off>`')] });
    db.set('fortniteShopVoting', setting === 'on');
    return message.reply({ embeds: [mkSuccess('Voting Toggle', `Shop voting: **${setting.toUpperCase()}**`)] });
  }

  if (sub === 'item') {
    const name = args.slice(1).join(' ');
    if (!name) return message.reply({ embeds: [mkError('Usage', '`,fortnite item <name>`')] });
    if (!checkCooldown(message.author.id, 'fortnite-item', 3))
      return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });
    const item = await searchFortniteItem(name);
    if (!item) return message.reply({ embeds: [mkError('Not Found', `No item matching "${name}".`)] });
    const embed = new EmbedBuilder()
      .setTitle(`${item.name} ${item.rarity?.displayValue || ''}`)
      .setDescription(item.description || 'No description')
      .setColor(item.rarity?.value === 'legendary' ? '#f39c12' : item.rarity?.value === 'epic' ? '#9b59b6' : '#3498db')
      .setImage(item.images?.icon || null)
      .addFields(
        { name: 'Type', value: item.type?.displayValue || 'Unknown', inline: true },
        { name: 'Rarity', value: item.rarity?.displayValue || 'Unknown', inline: true },
        { name: 'ID', value: item.id || 'N/A', inline: true },
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  if (sub === 'watch') {
    const item = args.slice(1).join(' ');
    if (!item) return message.reply({ embeds: [mkError('Usage', '`,fortnite watch <item name>`')] });
    const watches = db.get('fortniteWatches', []);
    if (watches.includes(item)) return message.reply({ embeds: [mkError('Already Watching', `"${item}" is already on your watchlist.`)] });
    watches.push(item);
    db.set('fortniteWatches', watches);
    return message.reply({ embeds: [mkSuccess('Watch Added', `Watching **${item}** for shop appearances.`)] });
  }

  if (sub === 'watch' && args[1] === 'list') {
    const watches = db.get('fortniteWatches', []);
    if (!watches.length) return message.reply({ embeds: [mkInfo('Watch List', 'No items being watched.')] });
    return message.reply({ embeds: [new EmbedBuilder().setTitle('👀 Fortnite Watch List').setDescription(watches.map((w, i) => `${i + 1}. ${w}`).join('\n')).setColor('#9b59b6')] });
  }

  // Default: show shop
  if (!checkCooldown(message.author.id, 'fortnite', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const shop = await getFortniteShop();
  if (!shop) return message.reply({ embeds: [mkError('Error', 'Could not fetch the Fortnite Item Shop.')] });

  const entries = shop.feature?.entries || [];
  const items = entries.slice(0, 10).map(e => {
    const it = e.items?.[0];
    return it ? `• **${it.name}** (${it.rarity?.displayValue || 'Unknown'})` : `• ${e.bundle?.name || 'Bundle'}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🛒 Fortnite Item Shop')
    .setDescription(items || 'No items available.')
    .setColor('#9b59b6')
    .setFooter({ text: `Date: ${shop.date || 'Unknown'}` })
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// YOUTUBE
// ══════════════════════════════════════════════════════════

async function handleYouTube(message, args) {
  const sub = args[0]?.toLowerCase();
  const db = getGuildDb(message.guild.id);

  if (sub === 'list') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const feeds = db.get('youtubeFeeds', {});
    const entries = Object.entries(feeds);
    if (!entries.length) return message.reply({ embeds: [mkInfo('YouTube Feeds', 'No feeds configured.')] });
    let desc = '';
    for (const [url, data] of entries) {
      desc += `**${url}** → <#${data.channelId}>${data.message ? ` | msg: "${data.message.slice(0, 30)}..."` : ''}\n`;
    }
    return message.reply({ embeds: [new EmbedBuilder().setTitle('▶️ YouTube Feeds').setDescription(desc).setColor('#FF0000')] });
  }

  if (sub === 'add') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const url = args[2];
    if (!channel || !url) return message.reply({ embeds: [mkError('Usage', '`,youtube add #channel <channel-url>`')] });
    const feeds = db.get('youtubeFeeds', {});
    feeds[url] = { channelId: channel.id, message: null };
    db.set('youtubeFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Added', `YouTube **${url}** → <#${channel.id}>`)] });
  }

  if (sub === 'remove') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const url = args[2];
    if (!channel || !url) return message.reply({ embeds: [mkError('Usage', '`,youtube remove #channel <channel-url>`')] });
    const feeds = db.get('youtubeFeeds', {});
    delete feeds[url];
    db.set('youtubeFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Removed', `Removed **${url}** from <#${channel.id}>`)] });
  }

  if (sub === 'message') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const url = args[1];
    const msg = args.slice(2).join(' ');
    if (!url) return message.reply({ embeds: [mkError('Usage', '`,youtube message <channel-url> <message>`')] });
    const feeds = db.get('youtubeFeeds', {});
    if (!feeds[url]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    if (!msg) {
      return message.reply({ embeds: [mkInfo('YouTube Message', `Current message for **${url}**: "${feeds[url].message || 'Default'}"`)] });
    }
    feeds[url].message = msg;
    db.set('youtubeFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Message Set', `Message for **${url}** updated.`)] });
  }

  if (sub === 'message' && args[1] === 'view') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const url = args[2];
    if (!url) return message.reply({ embeds: [mkError('Usage', '`,youtube message view <channel-url>`')] });
    const feeds = db.get('youtubeFeeds', {});
    if (!feeds[url]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    return message.reply({ embeds: [mkInfo('YouTube Message', `Message for **${url}**: "${feeds[url].message || 'Default'}"`)] });
  }

  // Default: search
  const query = args.join(' ');
  if (!query) return message.reply({ embeds: [mkError('Usage', '`,youtube <search>` or `,youtube list/add/remove/message`')] });
  if (!checkCooldown(message.author.id, 'youtube', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  // Use YouTube oEmbed as a basic search fallback
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const embed = new EmbedBuilder()
      .setTitle('▶️ YouTube Search')
      .setDescription(`Search results for **"${query}"**\n\n[Click to view on YouTube](${searchUrl})`)
      .setColor('#FF0000')
      .setURL(searchUrl)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  } catch {
    return message.reply({ embeds: [mkError('Error', 'Could not perform YouTube search.')] });
  }
}

// ══════════════════════════════════════════════════════════
// TWITCH
// ══════════════════════════════════════════════════════════

async function getTwitchUser(username) {
  // Try using Twitch's public GQL or basic page info
  try {
    const { data } = await axios.get(`https://www.twitch.tv/${username}`, {
      headers: { 'Accept': 'text/html', 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko' },
      timeout: 8000,
    });
    // Extract basic info from meta tags
    const displayName = data.match(/"displayName":"([^"]+)"/)?.[1];
    const description = data.match(/<meta name="description" content="([^"]+)"/)?.[1];
    const pfp = data.match(/"profileImageURL":"([^"]+)"/)?.[1];
    return { displayName, description, pfp };
  } catch { return null; }
}

async function handleTwitch(message, args) {
  const sub = args[0]?.toLowerCase();
  const db = getGuildDb(message.guild.id);

  if (sub === 'list') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const feeds = db.get('twitchFeeds', {});
    const entries = Object.entries(feeds);
    if (!entries.length) return message.reply({ embeds: [mkInfo('Twitch Feeds', 'No feeds configured.')] });
    let desc = '';
    for (const [streamer, data] of entries) {
      desc += `**${streamer}** → <#${data.channelId}>${data.message ? ` | msg: "${data.message.slice(0, 30)}..."` : ''}\n`;
    }
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🎥 Twitch Feeds').setDescription(desc).setColor('#9146FF')] });
  }

  if (sub === 'add') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const streamer = args[2]?.toLowerCase();
    if (!channel || !streamer) return message.reply({ embeds: [mkError('Usage', '`,twitch add #channel <streamer>`')] });
    const feeds = db.get('twitchFeeds', {});
    feeds[streamer] = { channelId: channel.id, message: null };
    db.set('twitchFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Added', `Twitch **${streamer}** → <#${channel.id}>`)] });
  }

  if (sub === 'remove') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    const streamer = args[2]?.toLowerCase();
    if (!channel || !streamer) return message.reply({ embeds: [mkError('Usage', '`,twitch remove #channel <streamer>`')] });
    const feeds = db.get('twitchFeeds', {});
    delete feeds[streamer];
    db.set('twitchFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Feed Removed', `Removed **${streamer}** from <#${channel.id}>`)] });
  }

  if (sub === 'message') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const streamer = args[1]?.toLowerCase();
    const msg = args.slice(2).join(' ');
    if (!streamer) return message.reply({ embeds: [mkError('Usage', '`,twitch message <streamer> <message>`')] });
    const feeds = db.get('twitchFeeds', {});
    if (!feeds[streamer]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    if (!msg) {
      return message.reply({ embeds: [mkInfo('Twitch Message', `Current message for **${streamer}**: "${feeds[streamer].message || 'Default'}"`)] });
    }
    feeds[streamer].message = msg;
    db.set('twitchFeeds', feeds);
    return message.reply({ embeds: [mkSuccess('Message Set', `Message for **${streamer}** updated.`)] });
  }

  if (sub === 'message' && args[1] === 'view') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [mkError('Permission Denied', 'You need **Manage Server**.')] });
    const streamer = args[2]?.toLowerCase();
    if (!streamer) return message.reply({ embeds: [mkError('Usage', '`,twitch message view <streamer>`')] });
    const feeds = db.get('twitchFeeds', {});
    if (!feeds[streamer]) return message.reply({ embeds: [mkError('Not Found', 'That feed does not exist.')] });
    return message.reply({ embeds: [mkInfo('Twitch Message', `Message for **${streamer}**: "${feeds[streamer].message || 'Default'}"`)] });
  }

  // Default: profile lookup
  const username = args[0]?.toLowerCase() || args.join(' ');
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,twitch <username>` or `,twitch list/add/remove/message`')] });
  if (!checkCooldown(message.author.id, 'twitch', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const profile = await getTwitchUser(username);
  const embed = new EmbedBuilder()
    .setTitle(`🎥 Twitch — ${profile?.displayName || username}`)
    .setDescription(profile?.description || `Profile page for **${username}**`)
    .setColor('#9146FF')
    .setURL(`https://www.twitch.tv/${username}`)
    .setTimestamp();
  if (profile?.pfp) embed.setThumbnail(profile.pfp);
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// ROBLOX
// ══════════════════════════════════════════════════════════

async function searchRobloxUser(username) {
  const data = await fetchJSON('https://users.roblox.com/v1/users/search?keyword=' + encodeURIComponent(username) + '&limit=1');
  return data?.data?.[0] || null;
}

async function getRobloxUserInfo(userId) {
  return fetchJSON(`https://users.roblox.com/v1/users/${userId}`);
}

async function getRobloxInventory(userId, assetType) {
  return fetchJSON(`https://inventory.roblox.com/v2/users/${userId}/inventory?assetType=${assetType || ''}&limit=10`);
}

async function getRobloxOutfits(userId) {
  return fetchJSON(`https://avatar.roblox.com/v1/users/${userId}/outfits`);
}

async function getRobloxAvatar(userId) {
  return fetchJSON(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`);
}

async function searchRobloxAsset(query) {
  const data = await fetchJSON(`https://catalog.roblox.com/v1/search/items?category=All&keyword=${encodeURIComponent(query)}&limit=1`);
  return data?.data?.[0] || null;
}

async function handleRoblox(message, args) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'fromdiscord') {
    const userId = args[1];
    if (!userId || !/^\d+$/.test(userId)) return message.reply({ embeds: [mkError('Usage', '`,roblox fromdiscord <user-id>`')] });
    // No official API for this; return informative message
    return message.reply({ embeds: [mkInfo('Roblox ↔ Discord', 'There is no official API to map Discord IDs to Roblox accounts. Use a verification bot like Bloxlink or RoVer for this feature.')] });
  }

  if (sub === 'outfits') {
    const username = args[1];
    if (!username) return message.reply({ embeds: [mkError('Usage', '`,roblox outfits <username>`')] });
    if (!checkCooldown(message.author.id, 'roblox-outfits', 5))
      return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });
    const user = await searchRobloxUser(username);
    if (!user) return message.reply({ embeds: [mkError('Not Found', `User "${username}" not found.`)] });
    const outfits = await getRobloxOutfits(user.id);
    const list = outfits?.data?.slice(0, 10).map((o, i) => `${i + 1}. **${o.name}**`).join('\n') || 'No outfits found.';
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`👕 Outfits — ${user.name}`).setDescription(list).setColor('#de2821')] });
  }

  if (sub === 'check') {
    const username = args[1];
    const asset = args.slice(2).join(' ');
    if (!username || !asset) return message.reply({ embeds: [mkError('Usage', '`,roblox check <username> <asset id or name>`')] });
    if (!checkCooldown(message.author.id, 'roblox-check', 5))
      return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });
    const user = await searchRobloxUser(username);
    if (!user) return message.reply({ embeds: [mkError('Not Found', `User "${username}" not found.`)] });
    let assetId = asset;
    if (!/^\d+$/.test(asset)) {
      const found = await searchRobloxAsset(asset);
      if (!found) return message.reply({ embeds: [mkError('Not Found', `Asset "${asset}" not found.`)] });
      assetId = found.id;
    }
    const inv = await getRobloxInventory(user.id);
    const hasIt = inv?.data?.some(i => String(i.assetId) === String(assetId));
    return message.reply({ embeds: [mkInfo('Inventory Check', `**${user.name}** ${hasIt ? 'owns' : 'does NOT own'} asset **${asset}**.`)] });
  }

  if (sub === 'devex') {
    const robux = parseInt(args[1]);
    if (isNaN(robux)) return message.reply({ embeds: [mkError('Usage', '`,roblox devex <robux>`')] });
    // DevEx rate: 100K Robux = $350 USD (as of recent rates)
    const usd = (robux / 100000 * 350).toFixed(2);
    return message.reply({ embeds: [new EmbedBuilder().setTitle('💰 DevEx Calculator').setDescription(`**${robux.toLocaleString()}** Robux ≈ **$${usd}** USD\n\n_Rate: 100,000 R$ = $350 USD (approximate)_`).setColor('#2ecc71')] });
  }

  if (sub === 'item') {
    const query = args.slice(1).join(' ');
    if (!query) return message.reply({ embeds: [mkError('Usage', '`,roblox item <query>`')] });
    if (!checkCooldown(message.author.id, 'roblox-item', 5))
      return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });
    const item = await searchRobloxAsset(query);
    if (!item) return message.reply({ embeds: [mkError('Not Found', `No item matching "${query}".`)] });
    const embed = new EmbedBuilder()
      .setTitle(item.name)
      .setDescription(`Type: ${item.itemType || 'Unknown'}\nID: **${item.id}**`)
      .setColor('#de2821')
      .setURL(`https://www.roblox.com/catalog/${item.id}/`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  if (sub === 'inventory') {
    const username = args[1];
    if (!username) return message.reply({ embeds: [mkError('Usage', '`,roblox inventory <username>`')] });
    if (!checkCooldown(message.author.id, 'roblox-inv', 5))
      return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });
    const user = await searchRobloxUser(username);
    if (!user) return message.reply({ embeds: [mkError('Not Found', `User "${username}" not found.`)] });
    const inv = await getRobloxInventory(user.id);
    const list = inv?.data?.slice(0, 15).map((i, idx) => `${idx + 1}. **${i.assetName || 'Unknown'}** (ID: ${i.assetId})`).join('\n') || 'No items found or inventory is private.';
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🎒 Inventory — ${user.name}`).setDescription(list).setColor('#de2821')] });
  }

  if (sub === 'template') {
    const assetId = args[1];
    if (!assetId || !/^\d+$/.test(assetId)) return message.reply({ embeds: [mkError('Usage', '`,roblox template <asset-id>`')] });
    return message.reply({ embeds: [mkInfo('Asset Template', `[Download Asset](https://assetdelivery.roblox.com/v1/asset/?id=${assetId}) | [View in Catalog](https://www.roblox.com/catalog/${assetId}/)`)] });
  }

  if (sub === 'todiscord') {
    const username = args[1];
    if (!username) return message.reply({ embeds: [mkError('Usage', '`,roblox todiscord <username>`')] });
    return message.reply({ embeds: [mkInfo('Roblox ↔ Discord', 'There is no official API to map Roblox usernames to Discord accounts. Use a verification bot like Bloxlink or RoVer for this feature.')] });
  }

  // Default: profile lookup
  const username = args[0] || args.join(' ');
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,roblox <username>` or `,roblox outfits/check/devex/item/inventory/template/fromdiscord/todiscord`')] });
  if (!checkCooldown(message.author.id, 'roblox', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const user = await searchRobloxUser(username);
  if (!user) return message.reply({ embeds: [mkError('Not Found', `User "${username}" not found on Roblox.`)] });
  const info = await getRobloxUserInfo(user.id);
  const avatar = await getRobloxAvatar(user.id);
  const embed = new EmbedBuilder()
    .setTitle(`🎮 Roblox — ${info?.name || user.name}`)
    .setDescription(info?.description || 'No description.')
    .setColor('#de2821')
    .setURL(`https://www.roblox.com/users/${user.id}/profile`)
    .addFields(
      { name: 'Display Name', value: info?.displayName || user.name, inline: true },
      { name: 'User ID', value: String(user.id), inline: true },
      { name: 'Created', value: info?.created ? new Date(info.created).toLocaleDateString() : 'Unknown', inline: true },
    )
    .setTimestamp();
  if (avatar?.data?.[0]?.imageUrl) embed.setThumbnail(avatar.data[0].imageUrl);
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// CASHAPP
// ══════════════════════════════════════════════════════════

async function handleCashapp(message, args) {
  const username = args[0];
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,cashapp <username>`')] });
  if (!checkCooldown(message.author.id, 'cashapp', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const embed = new EmbedBuilder()
    .setTitle(`💸 CashApp — $${username}`)
    .setDescription(`CashApp profile for **$${username}**\n\n[Open in CashApp](https://cash.app/$${username})`)
    .setColor('#00D632')
    .setURL(`https://cash.app/$${username}`)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// XBOX
// ══════════════════════════════════════════════════════════

async function handleXbox(message, args) {
  const gamertag = args[0] || args.join(' ');
  if (!gamertag) return message.reply({ embeds: [mkError('Usage', '`,xbox <gamertag>`')] });
  if (!checkCooldown(message.author.id, 'xbox', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const embed = new EmbedBuilder()
    .setTitle(`🎮 Xbox — ${gamertag}`)
    .setDescription(`Xbox profile for **${gamertag}**\n\n[Xbox Profile](https://www.xbox.com/play/games/profile?gamertag=${encodeURIComponent(gamertag)})`)
    .setColor('#107C10')
    .setURL(`https://www.xbox.com/play/games/profile?gamertag=${encodeURIComponent(gamertag)}`)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// SNAPCHAT
// ══════════════════════════════════════════════════════════

async function handleSnapchatStory(message, args) {
  const username = args[0];
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,snapchatstory <username>`')] });
  if (!checkCooldown(message.author.id, 'snapchatstory', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const embed = new EmbedBuilder()
    .setTitle(`👻 Snapchat Stories — ${username}`)
    .setDescription(`Stories for **${username}**\n\n[View on Snapchat](https://www.snapchat.com/add/${username})`)
    .setColor('#FFFC00')
    .setURL(`https://www.snapchat.com/add/${username}`)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

async function handleSnapchat(message, args) {
  const username = args[0];
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,snapchat <username>`')] });
  if (!checkCooldown(message.author.id, 'snapchat', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const embed = new EmbedBuilder()
    .setTitle(`👻 Snapchat — ${username}`)
    .setDescription(`Bitmoji and QR code for **${username}**`)
    .setColor('#FFFC00')
    .setURL(`https://www.snapchat.com/add/${username}`)
    .setImage(`https://app.snapchat.com/web/deeplink/snapcode?username=${username}&type=SVG&bitmoji=enable`)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// VALORANT
// ══════════════════════════════════════════════════════════

async function getValorantAccount(name, tag) {
  // Using Henrik's Valorant API (unofficial but free)
  try {
    const { data } = await axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, { timeout: 8000 });
    return data?.data || null;
  } catch { return null; }
}

async function handleValorant(message, args) {
  const query = args.join(' ');
  if (!query) return message.reply({ embeds: [mkError('Usage', '`,valorant <name#tag>`')] });
  if (!checkCooldown(message.author.id, 'valorant', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const [name, tag] = query.split('#');
  if (!name || !tag) return message.reply({ embeds: [mkError('Usage', '`,valorant <name#tag>` — e.g. `,valorant Player#NA1`')] });

  const account = await getValorantAccount(name.trim(), tag.trim());
  if (!account) return message.reply({ embeds: [mkError('Not Found', `Account **${name}#${tag}** not found.`)] });

  const embed = new EmbedBuilder()
    .setTitle(`🔫 Valorant — ${account.name}#${account.tag}`)
    .setDescription(`Region: **${account.region || 'Unknown'}**\nAccount Level: **${account.account_level || 'Unknown'}**`)
    .setColor('#ff4655')
    .setURL(`https://tracker.gg/valorant/profile/riot/${encodeURIComponent(account.name)}%23${encodeURIComponent(account.tag)}/overview`)
    .setThumbnail(account.card?.small || null)
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// MINECRAFT
// ══════════════════════════════════════════════════════════

async function getMinecraftProfile(username) {
  const data = await fetchJSON(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
  if (!data) return null;
  const profile = await fetchJSON(`https://sessionserver.mojang.com/session/minecraft/profile/${data.id}`);
  return { ...data, profile };
}

async function handleMinecraft(message, args) {
  const username = args[0] || args.join(' ');
  if (!username) return message.reply({ embeds: [mkError('Usage', '`,minecraft <username>`')] });
  if (!checkCooldown(message.author.id, 'minecraft', 5))
    return message.reply({ embeds: [mkError('Cooldown', 'Please wait a few seconds.')] });

  const data = await getMinecraftProfile(username);
  if (!data) return message.reply({ embeds: [mkError('Not Found', `Minecraft account "${username}" not found.`)] });

  const embed = new EmbedBuilder()
    .setTitle(`⛏️ Minecraft — ${data.name}`)
    .setDescription(`UUID: \`${data.id}\``)
    .setColor('#55FF55')
    .setThumbnail(`https://crafthead.net/avatar/${data.id}`)
    .addFields(
      { name: 'Name', value: data.name, inline: true },
      { name: 'UUID (Dashed)', value: data.id.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5'), inline: true },
      { name: 'Skin', value: `[View](https://crafthead.net/body/${data.id})`, inline: true },
    )
    .setTimestamp();
  return message.reply({ embeds: [embed] });
}

// ══════════════════════════════════════════════════════════
// MAIN ROUTER
// ══════════════════════════════════════════════════════════

const SOCIALS_COMMANDS = new Set([
  'tiktok', 'twitter', 'fortnite', 'fortniteshop', 'youtube', 'twitch',
  'roblox', 'cashapp', 'xbox', 'snapchatstory', 'snapchat', 'valorant', 'minecraft'
]);

async function handleSocialsCommand(message, command, args) {
  switch (command) {
    case 'tiktok': return handleTiktok(message, args);
    case 'twitter': return handleTwitter(message, args);
    case 'fortnite': return handleFortnite(message, args);
    case 'fortniteshop': return handleFortnite(message, ['shop']);
    case 'youtube': return handleYouTube(message, args);
    case 'twitch': return handleTwitch(message, args);
    case 'roblox': return handleRoblox(message, args);
    case 'cashapp': return handleCashapp(message, args);
    case 'xbox': return handleXbox(message, args);
    case 'snapchatstory': return handleSnapchatStory(message, args);
    case 'snapchat': return handleSnapchat(message, args);
    case 'valorant': return handleValorant(message, args);
    case 'minecraft': return handleMinecraft(message, args);
    default: return message.reply({ embeds: [mkError('Unknown', 'Unknown socials command.')] });
  }
}

module.exports = {
  handleSocialsCommand,
  SOCIALS_COMMANDS,
};