const { PREFIX } = require('../config');
const { checkIfStaff } = require('../utils/utils');

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  async execute(message, args) {
    let fields = [];
    const { commands } = message.client;
    const isStaff = await checkIfStaff(message.author.id);

    const allowedCommands = commands.forEach((command) => {
      if (command.staffOnly && !isStaff) {
        return;
      }

      if (command.disabled) {
        return;
      }

      return command;
    });

    if (!args.length) {
      allowedCommands.forEach((command) => {
        fields.push({
          name: command.name,
          value: `\`${command.name}\`: ${command.description}`,
        });
      });

      try {
        await message.author.send({
          embeds: [
            {
              title: 'Foxy Help',
              fields: fields,
            },
          ],
        });
        if (message.channel.type === 'dm') return;
        return await message.reply(`I've sent you a DM with all my commands!`);
      } catch (e) {
        console.error(`Could not send help DM to ${message.author.tag}.\n`, e);
        return await message.reply(
          `It seems I can't DM you! Do you have DMs disabled?`
        );
      }
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name);

    if (!command) {
      return await message.reply(`That is not a valid command!`);
    }

    fields = [
      {
        name: 'Name',
        value: command.name,
      },
      {
        name: 'Description',
        value: command.description,
      },
    ];

    if (command.usage) {
      fields.push({
        name: 'Usage',
        value: `\`\`\`
${PREFIX} ${command.usage}
\`\`\``,
      });
    }

    try {
      await message.channel.send({
        embeds: [
          {
            title: 'Foxy Help',
            fields: fields,
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to send help message`, error);
      return await message.reply(`Failed to send help message`);
    }
  },
};
