require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const axios = require('axios');

const { checkIfStaff } = require('./utils/utils');

const TH_API_URL = process.env.TH_API_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;
const VAULT_TOKEN = process.env.VAULT_TOKEN;
const PREFIX = process.env.PREFIX;
const TICKET_REACTION_MESSAGE_ID = '761675226316406784';

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

const startBot = async () => {
  try {
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
      if (
        !user.bot &&
        messageReaction.message.id == TICKET_REACTION_MESSAGE_ID
      ) {
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
        return message.reply(
          `I can only execute \`${commandName}\` inside DMs!`
        );
      }

      if (command.disabled) {
        return message.reply(`\`${commandName}\` is disabled`);
      }

      if (command.staffOnly) {
        const isStaff = await checkIfStaff(message.author.id);
        if (!isStaff) {
          return message.reply(
            `You don't have permission to use this \`${commandName}\`!`
          );
        }
      }

      // Check for app creds on Vault, request new token and pass to props
      if (command.labAuth) {
        try {
          // Get id and secret from Vault
          const vaultRes = await axios({
            method: 'get',
            url: `${TH_API_URL}/vault/secrets/${message.author.id}`,
            headers: {
              'X-Vault-Token': VAULT_TOKEN,
            },
          });

          if (vaultRes.data.error) {
            return message.reply(`**Error**: ${vaultRes.data.error}`);
          }

          const {
            application_credential_id,
            application_credential_secret,
          } = vaultRes.data.data;

          // Request token
          const tokenRes = await axios({
            method: 'post',
            url: `${TH_API_URL}/openstack/auth/tokens`,
            data: {
              id: application_credential_id,
              secret: application_credential_secret,
            },
          });

          if (tokenRes.data.error) {
            return message.reply(`**Error**: ${tokenRes.data.error}`);
          }

          props.xAuthToken = tokenRes.headers['x-subject-token'];
        } catch (error) {
          return message.reply(
            `Please login to the lab to use this command. Use \`${PREFIX} help lab-login\` command for help.`
          );
        }
      }

      // Check for SSH Key on Keystone account
      if (command.sshKeyRequired) {
        try {
          await axios({
            method: 'get',
            url: `${TH_API_URL}/openstack/os-keypairs`,
            headers: {
              'X-Auth-Token': props.xAuthToken,
            },
          });
        } catch (error) {
          console.error(error);
          return message.reply(
            `Please save a SSH key to your account before creating a VM. Use the \`${PREFIX} help update-ssh\` command for help.`
          );
        }
      }

      if (command.args && !args.length) {
        let reply = `${message.author}, you didn't provide any arguments!`;

        if (command.usage) {
          reply += `\nThe correct usage would be: \`\`\`
          ${PREFIX} ${command.name}
          ${command.usage}\`\`\``;
        }

        return message.reply(reply);
      }

      try {
        command.execute(message, args, props);
      } catch (e) {
        console.log(e);
        message.reply('Oops! There was an error trying to run that command!');
      }
    });

    client.login(BOT_TOKEN);
  } catch (error) {
    console.error(`Bot failed to start`, error);
    process.exit(1);
  }
};

startBot();
