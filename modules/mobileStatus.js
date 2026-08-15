/**
 * mobileStatus.js — Forces the bot to show the mobile (phone) online indicator
 * 
 * REQUIRE THIS IN YOUR index.js BEFORE creating the Client:
 *   require('./modules/mobileStatus');
 * 
 * Works on Discord.js v14.x
 */

const { WebSocketShard } = require('discord.js');

// Patch the identify payload so Discord thinks we're on mobile
const originalIdentify = WebSocketShard.prototype.identify;
WebSocketShard.prototype.identify = async function(...args) {
  // Force mobile properties into the identify payload
  this._mobilePatch = true;
  return originalIdentify.apply(this, args);
};

// Also patch the _send method to inject mobile props into the identify payload
const originalSend = WebSocketShard.prototype._send;
WebSocketShard.prototype._send = function(data) {
  if (data && data.op === 2 && data.d) {
    // op 2 = Identify — inject mobile properties here
    data.d.properties = {
      os: 'ios',
      browser: 'Discord iOS',
      device: 'ios',
      system_locale: 'en-US',
      browser_user_agent: '',
      browser_version: '',
      os_version: '',
      referrer: '',
      referring_domain: '',
      referrer_current: '',
      referring_domain_current: '',
      release_channel: 'stable',
      client_build_number: 0,
      client_event_source: null,
    };
  }
  return originalSend.call(this, data);
};

console.log('[MobileStatus] Patched WebSocketShard — bot will appear as mobile');