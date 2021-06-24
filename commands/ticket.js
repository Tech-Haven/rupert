const axios = require('axios');
const yparse = require('yargs-parser');
const { createThread } = require('../utils/forums');

const FORUMS_TOKEN = process.env.FORUMS_TOKEN;
const TH_API_URL = process.env.TH_API_URL;

const timeoutTime = 300000; // 5 minutes
let ticketObject = {};

let categoryCollector;
let titleCollector;
let descriptionCollector;

module.exports = {
  name: 'ticket',
  description: 'Create a help desk ticket, and send it to the forums',
  guildOnly: true,
  args: true,
  usage: `
  -t --title "<title>" 
      Title / Summary of your ticket (required)
  -d --description "<description>"
      Description / details that makes up the body of your ticket (required)`,
  async sendToDm(messageReaction, user) {
    // Send DM to user asking for ticket information.
    try {
      await user.send(
        `Thank you for using the Tech Haven ticket system! Keep in mind, I will stop listening for a response after ${
          timeoutTime / 60000
        } minutes of inactivity.`
      );
      await messageReaction.users.remove(user);
    } catch (error) {
      return console.error(
        `Could not send help DM to ${user.username}.\n`,
        error
      );
    }

    if (categoryCollector) {
      categoryCollector.stop();
    }

    if (titleCollector) {
      titleCollector.stop();
    }

    if (descriptionCollector) {
      descriptionCollector.stop();
    }
    waitForCategory(user);
  },
  async execute(message, args) {
    const yargs = yparse(args.join(' '), {
      alias: { title: ['t'], description: ['d'] },
    });

    if (!yargs._.length == 0) {
      return message.reply(
        `Something is wrong with your request. Please use double quotes (") around your title and description.`
      );
    }

    if (!yargs.title) {
      return message.reply(`Please enter a title.`);
    }

    if (!yargs.description) {
      return message.reply(`Please enter a description.`);
    }

    let nodeID;
    switch (message.channel.name) {
      case 'general-help':
        nodeID = 37;
        break;
      case 'networking-help':
        nodeID = 9;
        break;
      case 'windows-help':
        nodeID = 10;
        break;
      case 'linux_unix-help':
        nodeID = 11;
        break;
      case 'programming-help':
        nodeID = 12;
        break;
      case 'cybersecurity-help':
        nodeID = 13;
        break;
      case 'electronics-help':
        nodeID = 14;
        break;
      default:
        nodeID = 37;
        break;
    }

    const title = yargs.title;
    const description = `${yargs.description} \n\n Ticket created by ${message.author.username}#${message.author.discriminator}`;

    const body = {
      node_id: nodeID,
      title,
      message: description,
    };

    try {
      const res = await axios({
        method: 'post',
        url: `${TH_API_URL}/forums/threads`,
        data: body,
        headers: {
          'XF-Api-Key': FORUMS_TOKEN,
          'Discord-ID': message.author.id,
        },
      });
      console.log(res);
      return message.reply(`Ticket created!`);
    } catch (error) {
      return message.reply(
        `Ticket creation failed! ${error.response.status}: ${error.response.data.error}
        
Please create an account at <https://thetechhaven.com/register/connected-accounts/ewr_discord/?setup=1> then use command \`${process.env.PREFIX} forum-link\` to link your forum and Discord account.
        `
      );
    }
  },
};

const waitForCategory = (user) => {
  categories = [
    'general',
    'cybersecurity',
    'electronics',
    'networking',
    'linux',
    'programming',
    'servers',
    'windows',
  ];

  user.send(
    `Type one of the categories listed that best fits your question. \n > ${categories.join(
      '\n > '
    )}`
  );

  categoryCollector = user.dmChannel.createMessageCollector(
    (m) => m.author.id === user.id,
    { max: 1, time: timeoutTime }
  );

  categoryCollector.on('collect', (reply) => {
    try {
      const ticketCategory = reply.content.trim().toLowerCase();
      if (ticketCategory === '') {
        categoryCollector.stop();
        waitForCategory(user);
      }

      let nodeID;
      switch (reply.content) {
        case 'general':
          nodeID = 37;
          break;
        case 'networking':
          nodeID = 9;
          break;
        case 'windows':
          nodeID = 10;
          break;
        case 'linux':
          nodeID = 11;
          break;
        case 'programming':
          nodeID = 12;
          break;
        case 'cybersecurity':
          nodeID = 13;
          break;
        case 'electronics':
          nodeID = 14;
          break;
        case 'servers':
          nodeID = 15;
          break;
        default:
          user.send(
            `Since that's not a category, we'll just go with general then...`
          );
          nodeID = 37;
          break;
      }
      ticketObject.nodeID = nodeID;
      categoryCollector.stop();
      waitForTitle(user);
    } catch (error) {
      return user.send(`Error! ${error}`);
    }
  });
};

const waitForTitle = (user) => {
  user.send(
    `Please give a short summary of your issue. This will be used as the the "Thread Title" on the forums...`
  );

  titleCollector = user.dmChannel.createMessageCollector(
    (m) => m.author.id === user.id,
    { max: 1, time: timeoutTime }
  );

  titleCollector.on('collect', (reply) => {
    try {
      const ticketTitle = reply.content.trim();
      if (ticketTitle === '') {
        titleCollector.stop();
        waitForTitle(user);
      }
      ticketObject.title = ticketTitle;
      titleCollector.stop();
      waitForDescription(user);
    } catch (error) {
      return user.send(`Error! ${error}`);
    }
  });
};

const waitForDescription = (user) => {
  user.send(
    `Please give a description of your issue. This should include any details of the problem. (2000 character limit because of Discord)`
  );

  descriptionCollector = user.dmChannel.createMessageCollector(
    (m) => m.author.id === user.id,
    { max: 1, time: timeoutTime }
  );

  descriptionCollector.on('collect', (reply) => {
    try {
      const ticketDescription = reply.content.trim();
      if (ticketDescription === '') {
        descriptionCollector.stop();
        waitForDescription(user);
      }
      ticketObject.description = `${ticketDescription}
      
      
      Ticket created by ${user.username}#${user.discriminator}`;
      descriptionCollector.stop();
      sendTicketToForums(user, ticketObject);
    } catch (error) {
      return user.send(`Error! ${error}`);
    }
  });
};

const sendTicketToForums = async (user, ticketObject) => {
  const { nodeID, title, description } = ticketObject;
  try {
    const res = await createThread(nodeID, title, description);

    if (res.error) {
      return user.send(`**Error!:** ${res.error}`);
    }

    return user.send(
      `Ticket created! Check the help desk category in Discord for confirmation.`
    );
  } catch (error) {
    return user.send(`**Error!:** ${error}`);
  }
};
