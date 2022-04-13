const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Turn member count channel on or off')
    .addStringOption((option) =>
      option
        .setName('visibility')
        .setDescription('Whether to show or hide channel')
        .setRequired(true)
        .addChoice('Show', 'show')
        .addChoice('Hide', 'hide')
    ),
  staffOnly: true,
  usage: `<show|hide>`,
  async update(guild) {
    const memberCountChannel = await getMemberCountChannel(guild);

    if (!memberCountChannel) return;

    memberCountChannel.setName(`Member Count: ${guild.memberCount}`);
  },
  async execute(interaction) {
    const visibility = interaction.options.getString('visibility');

    if (visibility === 'show') {
      showMemberCountChannel(interaction, true);
    }

    if (visibility === 'hide') {
      showMemberCountChannel(interaction, false);
    }
  },
};

// Get the member count channel
const getMemberCountChannel = async (guild) => {
  return await guild.channels.cache.find((channel) =>
    channel.name.startsWith('Member Count:')
  );
};

// Show or hide the member count
const showMemberCountChannel = async (interaction, visible) => {
  let memberCountChannel = await getMemberCountChannel(interaction.guild);

  if (visible) {
    if (memberCountChannel) {
      return await interaction.reply({
        content: 'Member count channel is already showing!',
        ephemeral: true,
      });
    }

    const channel = await createMemberCountChannel(interaction);
    channel.setName(`Member Count: ${interaction.guild.memberCount}`);

    return await interaction.reply(`Showing member count channel...`);
  } else {
    if (!memberCountChannel) {
      return await interaction.reply({
        content: 'Member count channel is already hidden!',
        ephemeral: true,
      });
    }

    await memberCountChannel.delete(
      `membercount hide command issued by ${interaction.user.tag}`
    );

    return await interaction.reply('Hiding member count channel...');
  }
};

const createMemberCountChannel = async (interaction) => {
  try {
    const channel = await interaction.guild.channels.create('Member Count:', {
      type: 'GUILD_VOICE',
      reason: `membercount show command issued by ${interaction.user.tag}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          allow: ['VIEW_CHANNEL'],
          deny: ['CONNECT'],
        },
        {
          id: interaction.client.user.id,
          allow: ['CONNECT', 'MANAGE_CHANNELS'],
        },
      ],
    });
    return channel;
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: 'Got an error while running this command!',
      ephemeral: true,
    });
  }
};
