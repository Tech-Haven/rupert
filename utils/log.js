const axios = require('axios');
const { GPT_WEBHOOK_URL } = require('../config');

const sendWebhook = async (url, body) => {
  await axios({
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(body),
  });
};

const logGpt = async (user, prompt) => {
  let body = {
    username: 'GPT Log',
    embeds: [
      {
        title: '/gpt Command Executed',
        fields: [
          {
            name: 'User',
            value: `<@${user.id}>`,
            inline: true,
          },
          {
            name: 'Prompt',
            value: prompt,
            inline: false,
          },
        ],
      },
    ],
  };
  await sendWebhook(GPT_WEBHOOK_URL, body);
};

exports.logGpt = logGpt;
