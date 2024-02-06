const { SlashCommandBuilder } = require('discord.js');
const { format, formatDistance } = require('date-fns');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get information on any Discord user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User ID or mention')
    ),
  guildOnly: true,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const createdAt = format(user.createdAt, 'MMM do yyyy, H:mm:ss');
    const createdAtFromNow = formatDistance(new Date(), user.createdAt);
    let fields;

    try {
      const guildMember = await interaction.guild.members.fetch(user);
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
          value: `<@&${guildMember.roles.highest.id}>`,
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
    } catch (err) {
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

    const embed = {
      color: 3447003,
      title: 'User Profile',
      description: `User data for <@${user.id}>`,
      thumbnail: {
        url: user.displayAvatarURL(),
      },
      fields: fields,
      timestamp: new Date(),
    };

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply('Got an error while running this command!', err);
      console.err(e);
    }
  },
};
