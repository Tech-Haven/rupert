const { SlashCommandBuilder } = require('@discordjs/builders');

const { checkIfStaff } = require('../utils/utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all of my commands or info about a specific command.')
    .addStringOption((option) =>
      option.setName('command').setDescription('Name of a command')
    ),
  async execute(interaction) {
    let fields = [];
    const { commands } = interaction.client;
    const isStaff = await checkIfStaff(interaction.user.id);

    const allowedCommands = commands.filter((command) => {
      if (command.staffOnly && !isStaff) {
        return;
      }

      if (command.disabled) {
        return;
      }

      return command;
    });

    const commandName = interaction.options.getString('command');

    if (!commandName) {
      allowedCommands.forEach((command) => {
        fields.push({
          name: command.data.name,
          value: `\`${command.data.name}\`: ${command.data.description}`,
        });
      });

      try {
        await interaction.user.send({
          embeds: [
            {
              title: 'Foxy Help',
              fields: fields,
            },
          ],
        });
        if (interaction.channel.type === 'dm') return;
        return await interaction.reply(
          `I've sent you a DM with all my commands!`
        );
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `It seems I can't DM you! Do you have DMs disabled?`,
          ephemeral: true,
        });
      }
    }

    const command = commands.get(commandName.toLowerCase());

    if (!command) {
      return await interaction.reply({
        content: `That is not a valid command!`,
        ephemeral: true,
      });
    }

    fields = [
      {
        name: 'Name',
        value: command.data.name,
      },
      {
        name: 'Description',
        value: command.data.description,
      },
    ];

    if (command.usage) {
      fields.push({
        name: 'Usage',
        value: `\`\`\`
/${command.data.name} ${command.usage}
\`\`\``,
      });
    }

    try {
      await interaction.reply({
        embeds: [
          {
            title: 'Foxy Help',
            fields: fields,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to send help message',
        ephemeral: true,
      });
    }
  },
};
