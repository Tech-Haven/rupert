require('dotenv').config();

if (process.env.NODE_ENV != 'development') {
  exports.CLIENT_ID = '619609304177311783';
  exports.GUILD_ID = '455345206481518593';
  exports.STAFF_ROLES = ['Staff', 'Server Admin'];
}

exports.CLIENT_ID = '1093604083908214935';
exports.GUILD_ID = '385903100453453825';

exports.BOT_TOKEN = process.env.FOXY_BOT_TOKEN;

exports.GPT_WEBHOOK_URL = process.env.GPT_WEBHOOK_URL;
