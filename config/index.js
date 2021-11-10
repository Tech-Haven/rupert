require('dotenv').config();

exports.GUILD_ID = '455345206481518593';
exports.STAFF_ROLES = ['Staff', 'Server Admin'];

exports.BOT_TOKEN = process.env.FOXY_BOT_TOKEN;
exports.TH_API_URL = process.env.TH_API_URL || 'http://localhost:5000/api/v1';
exports.PREFIX = process.env.FOXY_PREFIX || 'test!';
