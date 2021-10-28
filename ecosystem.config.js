const { BOT_TOKEN, TH_API_URL, PREFIX } = require('./config');

module.exports = {
  apps: [
    {
      name: 'foxy',
      script: './bot.js',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
        BOT_TOKEN: BOT_TOKEN,
        TH_API_URL: TH_API_URL,
        PREFIX: PREFIX,
      },
    },
  ],
};
