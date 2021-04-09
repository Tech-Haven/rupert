const yparse = require('yargs-parser');
const axios = require('axios');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'create-server',
  description: 'Create a new server instance on the lab.',
  usage: `
  -n --name "<server_name>"
      Hostname for the instance (required)
  -i --image "<image>"
      Name of the image / distro you want to create (required)
  -f --flavor "<flavor>"
      Name of the flavor / specs you want to create (required)`,
  args: true,
  labAuth: true,
  sshKeyRequired: true,
  async execute(message, args, props) {
    const yargs = yparse(args.join(' '), {
      alias: { name: ['n'], image: ['i'], flavor: ['f'] },
    });
    if (!yargs.name) {
      return message.reply(`Please enter a name.`);
    }

    if (!yargs.image) {
      return message.reply(`Please enter an image.`);
    }

    if (!yargs.flavor) {
      return message.reply(`Please enter a flavor.`);
    }

    try {
      // Find ID of image name
      const imageRes = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/images?name=${yargs.image}`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (imageRes.data.error) {
        return message.reply(`**Error**: ${imageRes.data.error}`);
      }

      const image = imageRes.data.data;

      // Find ID of flavor name
      const flavorRes = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/flavors?name=${yargs.flavor}`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (flavorRes.data.error) {
        return message.reply(`**Error**: ${flavorRes.data.error}`);
      }

      const flavor = flavorRes.data.data;

      // Send Create Server
      const newServerRes = await axios({
        method: 'post',
        url: `${TH_API_URL}/openstack/servers`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
        data: {
          name: yargs.name,
          imageRef: image.id,
          flavorRef: flavor.id,
        },
      });

      if (newServerRes.data.error) {
        return message.reply(`**Error**: ${newServerRes.data.error}`);
      }

      const newServer = newServerRes.data.data;

      // Get new server's info
      const serverResponse = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/servers/${newServer.id}`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      const server = serverResponse.data.data;

      const msg = await message.channel.send({
        embed: {
          color: '4DBBD3',
          title: `${server.name} - ${server.id}`,
          fields: [
            {
              name: 'IP Address',
              value: 'Allocating...',
              inline: true,
            },
            {
              name: 'Image',
              value: image.name,
              inline: true,
            },
            {
              name: 'Status',
              value: server.status,
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
          timestamp: new Date(),
          footer: {
            text: 'Sent via Foxy',
          },
        },
      });
      const ipCheck = setInterval(async () => {
        const serverResponse = await axios({
          method: 'get',
          url: `${TH_API_URL}/openstack/servers/${newServer.id}`,
          headers: {
            'X-Auth-Token': props.xAuthToken,
          },
        });
        if (serverResponse.data.data.addresses.hasOwnProperty('public')) {
          let ip = serverResponse.data.data.addresses.public[0].addr;
          clearInterval(ipCheck);
          msg.edit({
            embed: {
              color: '4DBBD3',
              title: `${server.name} - ${server.id}`,
              fields: [
                {
                  name: 'IP Address',
                  value: ip,
                  inline: true,
                },
                {
                  name: 'Image',
                  value: image.name,
                  inline: true,
                },
                {
                  name: 'Status',
                  value: server.status,
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
              timestamp: new Date(),
              footer: {
                text: 'Sent via Foxy',
              },
            },
          });
        }
      }, 5000);
    } catch (error) {
      message.reply(`Error! ${error}`);
    }
  },
};
