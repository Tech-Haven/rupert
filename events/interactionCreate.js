const { ChannelType } = require('discord.js');
const { checkIfStaff } = require('../utils/utils');

// Called when a slash command is executed by a user

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    if (command.guildOnly && interaction.channel.type != ChannelType.GuildText) {
      return await interaction.reply({
        content: `I can't execute \`${command.data.name}\` inside DMs!`,
        ephemeral: true,
      });
    }

    if (command.dmOnly && interaction.channel.type != ChannelType.DM) {
      return await interaction.reply({
        content: `I can only execute \`${command.data.name}\` inside DMs!`,
        ephemeral: true,
      });
    }

    if (command.disabled) {
      return await interaction.reply({
        content: `\`${command.data.name}\` is disabled`,
        ephemeral: true,
      });
    }

    if (command.staffOnly) {
      try {
        const isStaff = await checkIfStaff(interaction.user.id);
        if (!isStaff) {
          return await interaction.reply({
            content: `You don't have permission to use \`${command.data.name}\`!`,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: 'Staff check failed!',
          ephemeral: true,
        });
      }
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  },
};
