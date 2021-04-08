const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const TH_API_URL = process.env.TH_API_URL;
const ID = process.env.OPENSTACK_FOXY_API_APPLICATION_CREDS_ID;
const SECRET = process.env.OPENSTACK_FOXY_API_APPLICATION_CREDS_SECRET;
const GUILD_ID = '455345206481518593';

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
  let guildMember;
  try {
    guildMember = await getGuildMember(discordID);

    if (guildMember.error) {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }

  try {
    const res = await axios({
      method: 'get',
      url: `https://discordapp.com/api/guilds/${GUILD_ID}/roles`,
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    const guildRoles = res.data;
    const staffRoleFilter = ['Staff', 'Root', 'Server Admin'];
    const staffRoles = guildRoles.filter((role) =>
      staffRoleFilter.includes(role.name)
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

const getAdminToken = async () => {
  try {
    const config = {
      method: 'post',
      url: `${TH_API_URL}/openstack/auth/tokens`,
      data: {
        id: ID,
        secret: SECRET,
      },
    };
    const res = await axios(config);
    const token = res.headers['x-subject-token'];
    return token;
  } catch (error) {
    return { error };
  }
};

exports.getGuildMember = getGuildMember;
exports.checkIfStaff = checkIfStaff;
exports.getAdminToken = getAdminToken;
