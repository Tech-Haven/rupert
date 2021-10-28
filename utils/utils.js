const axios = require('axios');
const { BOT_TOKEN, GUILD_ID, STAFF_ROLES } = require('../config');

const getGuildMember = async (discordID) => {
  try {
    const res = await axios({
      method: 'get',
      url: `https://discordapp.com/api/guilds/${GUILD_ID}/members/${discordID}`,
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });
    return res.data;
  } catch (error) {
    return { error };
  }
};

const checkIfStaff = async (discordID) => {
  try {
    const guildMember = await getGuildMember(discordID);

    if (guildMember.error) {
      return false;
    }

    const res = await axios({
      method: 'get',
      url: `https://discordapp.com/api/guilds/${GUILD_ID}/roles`,
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    const guildRoles = res.data;
    const staffRoles = guildRoles.filter((role) =>
      STAFF_ROLES.includes(role.name)
    );
    const staff = staffRoles.some((r) => {
      return guildMember.roles.includes(r.id);
    });

    if (!staff) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.checkIfStaff = checkIfStaff;
