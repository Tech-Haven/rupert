const axios = require('axios');

const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'show-all-servers',
  description: 'Get info from all VMs owned by the user',
  labAuth: true,
  disabled: false,
  async execute(message, args, props) {
    try {
      const res = await axios({
        method: 'get',
        url: `${TH_API_URL}/openstack/servers`,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (res.data.error) {
        return message.reply(`**Error**: ${res.data.error}`);
      }

      const servers = res.data.data;

      if (Array.isArray(servers) && !servers.length) {
        return message.reply(
          `**Error**: No servers found. Create a new server with the \`create-server\` command.`
        );
      }

      const fields = servers.map((server) => {
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
        return [
          {
            name: 'ID',
            value: `${server.id}`,
            inline: true,
          },
          {
            name: 'IP Address',
            value: `${server.addresses.public[0].addr}`,
            inline: true,
          },
          {
            name: 'Status',
            value: status,
            inline: true,
          },
        ];
      });
      message.channel.send({
        embed: {
          title: `${message.author.username}'s VMs`,
          fields: fields,
        },
      });
    } catch (error) {
      console.error(error);
      message.reply(`**Error**: ${error}`);
    }
  },
};
