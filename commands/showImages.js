const axios = require('axios');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'show-images',
  description: 'Show different images available to spawn.',
  labAuth: true,
  disabled: false,
  async execute(message, args, props) {
    try {
      const res = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/images`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (res.data.error) {
        return message.reply(`**Error**: ${res.data.error}`);
      }

      const images = res.data.data;

      const fields = images.map((image) => {
        return [
          {
            name: 'Name',
            value: image.name,
            inline: true,
          },
        ];
      });

      message.channel.send({
        embed: {
          title: 'Images',
          description: 'Images available to spawn',
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
