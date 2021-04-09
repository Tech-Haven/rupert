const axios = require('axios');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'show-server',
  description: 'Get info from a VM on the Lab server',
  labAuth: true,
  disabled: false,
  async execute(message, args, props) {
    if (!args[0]) {
      return message.reply('Please enter a server id!');
    }
    try {
      const serverRes = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/servers/${args[0]}`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (serverRes.data.error) {
        return message.reply(`**Error**: ${serverRes.data.error}`);
      }

      const server = serverRes.data.data;

      const imageRes = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/images/${server.image.id}`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      const image = imageRes.data.data;

      let status;
      let color;
      switch (server.status) {
        case 'ACTIVE':
          status = server.status;
          color = '3adb76';
          break;
        case 'SHUTOFF':
          status = server.status;
          color = 'ffa07a';
          break;
        default:
          status = 'UNKNOWN';
          color = '4DBBD3';
          break;
      }

      message.channel.send({
        embed: {
          color: color,
          title: `${server.name} - ${server.id}`,
          fields: [
            {
              name: 'IP Address',
              value: server.addresses.public[0].addr,
              inline: true,
            },
            {
              name: 'Image',
              value: image.name,
              inline: true,
            },
            {
              name: 'Status',
              value: status,
              inline: true,
            },
            {
              name: 'CPU',
              value: server.flavor.vcpus,
              inline: true,
            },
            {
              name: 'Memory',
              value: `${server.flavor.ram} MB`,
              inline: true,
            },
            {
              name: 'Disk',
              value: `${server.flavor.disk} GB`,
              inline: true,
            },
          ],
        },
      });
    } catch (error) {
      console.error(error);
      message.reply(`**Error**: ${error}`);
    }
  },
};
