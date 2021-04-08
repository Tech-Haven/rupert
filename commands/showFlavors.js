const axios = require('axios');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'show-flavors',
  description: 'Show different flavors / distros available to spawn.',
  labAuth: true,
  disabled: false,
  async execute(message, args, props) {
    try {
      const res = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/flavors`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (res.data.error) {
        return message.reply(`**Error**: ${res.data.error}`);
      }

      const flavors = res.data.data;

      const fields = flavors.map((flavor) => {
        return [
          {
            name: 'Name',
            value: flavor.name,
            inline: true,
          },
        ];
      });

      message.channel.send({
        embed: {
          title: 'Flavors',
          description: 'Flavors available to spawn',
          fields: fields,
          timestamp: new Date(),
          footer: {
            text: 'Sent via Foxy',
          },
        },
      });
    } catch (error) {
      console.error(error);
      message.reply(`**Error**: ${error}`);
    }
  },
};
