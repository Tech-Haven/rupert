const format = require('date-fns/format');
const formatDistance = require('date-fns/formatDistance');

module.exports = {
  name: 'profile',
  description: 'Get information on any Discord user',
  guildOnly: true,
  async execute(message, args) {
    let guildMember;
    let user;
    if (!args[0]) {
      guildMember = message.member;
    } else {
      guildMember =
        message.mentions.members.first() ||
        (await message.guild.members.cache.get(args[0]));
    }
    try {
      guildMember
        ? (user = guildMember.user)
        : (user = await message.client.users.fetch(args[0]));
    } catch (e) {
      return message.reply('User ID is not valid');
    }
    const createdAt = format(user.createdAt, 'MMM do yyyy, H:mm:ss');
    const createdAtFromNow = formatDistance(new Date(), user.createdAt);
    let fields;
    if (guildMember) {
      const joinedAt = format(guildMember.joinedAt, 'MMM do yyyy, H:mm:ss');
      const joinedAtFromNow = formatDistance(new Date(), guildMember.joinedAt);
      fields = [
        {
          name: 'Username',
          value: user.tag,
          inline: true,
        },
        {
          name: 'ID',
          value: user.id,
          inline: true,
        },
        {
          name: 'Status',
          value: guildMember.presence.status,
          inline: true,
        },
        {
          name: 'Highest Role',
          value: guildMember.roles.highest.name,
          inline: true,
        },
        {
          name: 'Created',
          value: `${createdAt} 
                (${createdAtFromNow})`,
          inline: true,
        },
        {
          name: 'Joined',
          value: `${joinedAt}
                (${joinedAtFromNow})`,
          inline: true,
        },
      ];
    } else {
      fields = [
        {
          name: 'Username',
          value: user.tag,
          inline: true,
        },
        {
          name: 'ID',
          value: user.id,
          inline: true,
        },
        {
          name: 'Created',
          value: `${createdAt} 
          (${createdAtFromNow})`,
          inline: true,
        },
      ];
    }

    try {
      message.channel.send({
        embeds: [
          {
            color: 3447003,
            title: 'User Profile',
            description: `User data for <@${user.id}>`,
            thumbnail: {
              url: user.displayAvatarURL(),
            },
            fields: fields,
            timestamp: new Date(),
          },
        ],
      });
    } catch (e) {
      message.reply(`Sorry I couldnt display this profile because of : ${e}`);
      console.log(e);
    }
  },
};
