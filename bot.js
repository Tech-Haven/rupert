const fs = require('fs');
const Discord = require('discord.js');
const { BOT_TOKEN, PREFIX, TICKET_REACTION_MESSAGE_ID } = require('./config');
const { checkIfStaff } = require('./utils/utils');

const client = new Discord.Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Called when the server starts
client.on('ready', async () => {
  try {
    await client.user.setPresence({ activity: { name: `${PREFIX} help` } });
  } catch (error) {
    console.log('Error!', error);
  }

  console.log(`Logged in as ${client.user.tag}!`);
});

// Called when someone joins the guild
client.on('guildMemberAdd', (member) =>
  client.commands.get('membercount').update(member.guild)
);

// Called when someone leaves the guild
client.on('guildMemberRemove', (member) =>
  client.commands.get('membercount').update(member.guild)
);

client.on('messageReactionAdd', async (messageReaction, user) => {
  if (!user.bot && messageReaction.message.id == TICKET_REACTION_MESSAGE_ID) {
    try {
      client.commands.get('ticket').sendToDm(messageReaction, user);
    } catch (error) {
      return;
    }
  }
});

// Called whenever a message is created
client.on(`message`, async (message) => {
  // Ignore other bots
  if (message.author.bot) return;

  // Ignore messages without prefix
  if (message.content.indexOf(PREFIX) !== 0) return;

  // Splice "command" away from "arguments"
  const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
  const commandName = args.shift().toLowerCase();
  let props = {};

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply(`I can't execute \`${commandName}\` inside DMs!`);
  }

  if (command.dmOnly && message.channel.type !== 'dm') {
    return message.reply(`I can only execute \`${commandName}\` inside DMs!`);
  }

  if (command.disabled) {
    return message.reply(`\`${commandName}\` is disabled`);
  }

  if (command.staffOnly) {
    try {
      const isStaff = await checkIfStaff(message.author.id);
      if (!isStaff) {
        return message.reply(
          `You don't have permission to use this \`${commandName}\`!`
        );
      }
    } catch (error) {
      return message.reply('Staff check failed!', error);
    }
  }

  try {
    command.execute(message, args, props);
  } catch (e) {
    console.log(e);
    message.reply('Oops! There was an error trying to run that command!');
  }
});

client.login(BOT_TOKEN);
