const axios = require('axios');
const { MessageAttachment } = require('discord.js');
const { getAdminToken } = require('../utils/utils');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'lab-register',
  description: 'Create a new account on the lab.',
  dmOnly: true,
  async execute(message, args, props) {
    try {
      const adminToken = await getAdminToken();

      if (!adminToken || adminToken.error) {
        return message.reply(`**Error**: Could not retrieve admin token`);
      }

      const msg = await message.channel.send('Creating user...');
      // Bootstrap user registration
      const registerRes = await axios({
        method: 'post',
        url: `${TH_API_URL}/openstack/bootstrap`,
        headers: {
          'X-Auth-Token': adminToken,
        },
        data: {
          username: message.author.id,
          description: `${message.author.username}#${message.author.discriminator}`,
        },
      });

      if (registerRes.data.error) {
        return message.reply(`**Error**: ${registerRes.data.error}`);
      }

      const user = registerRes.data.data;

      msg.edit('Creating VPN file...');
      // Create/pull a VPN file
      const createVpnRes = await axios({
        method: 'get',
        url: `${TH_API_URL}/download/vpn`,
        headers: {
          'X-Auth-Token': user.token,
        },
      });

      if (createVpnRes.data.error) {
        return message.reply(`**Error**: ${createVpnRes.data.error}`);
      }

      message.channel.send({
        embed: {
          color: '4DBBD3',
          title: `Account Information`,
          fields: [
            {
              name: 'Lab Link',
              value: 'https://lab.thetechhaven.com',
            },
            {
              name: 'Username',
              value: user.name,
              inline: true,
            },
            {
              name: 'Password',
              value: user.password,
              inline: true,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: 'Sent via Foxy',
          },
        },
      });

      msg.edit('Retrieving VPN file...');
      const res = await axios({
        method: 'get',
        url: `${TH_API_URL}/download`,
        headers: {
          'X-Auth-Token': user.token,
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
      console.log(error);
      message.reply(`Error! ${error}`);
    }
  },
};
