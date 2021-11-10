const fs = require('fs');
const { Client, Intents, Collection } = require('discord.js');
const { BOT_TOKEN, PREFIX } = require('./config');
const { checkIfStaff } = require('./utils/utils');

const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
});
client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Called when the server starts
client.on('ready', async () => {
  client.user.setPresence({ activities: [{ name: `${PREFIX} help` }] });
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

// Called whenever a message is created
client.on(`messageCreate`, async (message) => {
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

  if (command.guildOnly && message.channel.type !== 'GUILD_TEXT') {
    return message.reply(`I can't execute \`${commandName}\` inside DMs!`);
  }

  if (command.dmOnly && message.channel.type !== 'DM') {
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
