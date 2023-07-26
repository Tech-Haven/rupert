const { promises: fsPromises } = require('fs');
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

const skidAlgorithm = async (input) => {
  input = input.toLowerCase();

  try {
    const file = await fsPromises.readFile('skid_keywords.txt', 'utf-8');
    const keywords = file.split(/\r?\n/);
    const searchString = (keywords) => {
      let occurances = 0;

      keywords.forEach((e) => {
        let regex = new RegExp(e);
        let count = regex.test(input) ? 1 : 0;
        occurances += count;
      });

      return occurances;
    };

    const occurances = searchString(keywords);
    const inputWordLength = input.split(' ').length;

    const prob = Math.round((occurances / inputWordLength) * 100);
    return prob > 5 ? true : false;
  } catch (error) {
    return error;
  }
};

const randomPromptAlgorithm = () => {
  const num = Math.random();
  if (num > 0.8 && num < 0.9) {
    return {
      role: 'system',
      content: 'You are a cute little fox furry. Answer questions in fursona.',
    };
  } else if (num > 0.9) {
    return {
      role: 'system',
      content:
        'You adore dik-diks, a small antelope creature. Be sure to talk about them whenever possible.',
    };
  }

  return null;
};

exports.checkIfStaff = checkIfStaff;
exports.skidAlgorithm = skidAlgorithm;
exports.randomPromptAlgorithm = randomPromptAlgorithm;
