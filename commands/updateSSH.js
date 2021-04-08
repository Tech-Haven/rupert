const axios = require('axios');

module.exports = {
  name: 'update-ssh',
  description:
    'Update your ssh key on the lab. For more information on creating a ssh keypair, see the following forum post: https://thetechhaven.com/threads/creating-ssh-key-pair-for-lab.9/',
  usage: `<ssh public key>`,
  disabled: true,
  args: true,
  labAuth: true,
  async execute(message, args, props) {
    const publicKey = `${args[0]} ${args[1]} ${args[2]}`;

    if (!publicKey) {
      return message.reply('Please enter your ssh public key!');
    }

    try {
      const keyRes = await axios({
        method: 'post',
        url: `${TH_API_URL}/openstack/os-keypairs/import`,
        body: publicKey,
        headers: {
          'X-Auth-Token': props.xAuthToken,
        },
      });

      if (keyRes.data.error) {
        return message.reply(`**Error**: ${keyRes.data.error}`);
      }

      return message.reply(`SSH key updated!`);
    } catch (error) {
      console.error(error);
      message.reply(`Error! ${error}`);
    }
  },
};
