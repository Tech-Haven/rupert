const axios = require('axios');
const { MessageAttachment } = require('discord.js');
const fs = require('fs');
const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'download-vpn',
  description: 'Download your lab VPN file',
  labAuth: true,
  disabled: false,
  dmOnly: true,
  async execute(message, args, props) {
    try {
      message.channel.send('Retrieving OVPN file...');
      const res = await axios({
        method: 'get',
        url: `${TH_API_URL}/download`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (res.data.error) {
        return message.reply(`**Error**: ${res.data.error}`);
      }

      const ovpn = res.data;

      const buffer = Buffer.from(ovpn);
      const attachment = new MessageAttachment(
        buffer,
        `${message.author.id}.ovpn`
      );

      message.channel.send(attachment);
    } catch (error) {
      console.error(error);
      message.reply(`**Error**: ${error}`);
    }
  },
};
