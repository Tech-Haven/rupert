const axios = require('axios');
const { getAdminToken } = require('../utils/utils');

const TH_API_URL = process.env.TH_API_URL;
const VAULT_TOKEN = process.env.VAULT_TOKEN;

module.exports = {
  name: 'lab-register',
  description: 'Create a new account on the lab.',
  async execute(message, args, props) {
    try {
      const adminToken = await getAdminToken();

      if (!adminToken || adminToken.error) {
        return message.reply(`**Error**: Could not retrieve admin token`);
      }

      // Bootstrap user registration
      const registerRes = await axios({
        method: 'post',
        url: `${TH_API_URL}/openstack/bootstrap`,
        headers: {
          'X-Auth-Token': adminToken,
          'X-Vault-Token': VAULT_TOKEN,
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

      const msg = message.channel.send({
        embed: {
          color: '4DBBD3',
          title: `Account Information`,
          fields: [
            {
              name: 'Lab Link',
              value: 'https://lab.thetechhaven.com',
            },
            {
              name: 'VPN Download Link',
              value: 'https://control.thetechhaven.com',
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
    } catch (error) {
      console.log(error);
      message.reply(`Error! ${error}`);
    }
  },
};
