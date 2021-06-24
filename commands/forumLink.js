const axios = require('axios');

const FORUMS_TOKEN = process.env.FORUMS_TOKEN;
const TH_API_URL = process.env.TH_API_URL;

module.exports = {
  name: 'forum-link',
  description:
    'Connect your TH forums and Discord account to send tickets to the forums',
  async execute(message, args) {
    const body = {
      discord_user: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
      },
    };

    try {
      await axios({
        method: 'post',
        url: `${TH_API_URL}/forums/forumUser`,
        data: body,
        headers: {
          'XF-Api-Key': FORUMS_TOKEN,
        },
      });
      return message.reply(`Accounts successfully linked!`);
    } catch (error) {
      return message.reply(`Account link failed! ${error}`);
    }
  },
};
