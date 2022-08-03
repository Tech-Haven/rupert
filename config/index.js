require('dotenv').config();

exports.CLIENT_ID = '619609304177311783';
exports.GUILD_ID = '455345206481518593';
exports.STAFF_ROLES = ['Staff', 'Server Admin'];

exports.BOT_TOKEN = process.env.FOXY_BOT_TOKEN;

exports.PROXMOX_URL =
  process.env.PROXMOX_URL || 'https://lab.techhaven.io/api2/json';
exports.PROXMOX_TOKEN = process.env.PROXMOX_TOKEN;

exports.PROXMOX_VM_IDS = {
  sift: 9005,
  flareVm: 9006,
};
