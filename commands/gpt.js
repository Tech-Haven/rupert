const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { logGpt } = require('../utils/log');
const { skidAlgorithm, randomPromptAlgorithm } = require('../utils/utils');
const { SKID_PROMPT } = require('../config/index');

const configuration = new Configuration({
  organization: 'org-teSKJbo1Bt3jMZnwo9v0A1gb',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gpt')
    .setDescription('Talk to ChatGPT using the gpt-3.5-turbo model!')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Question or prompt for ChatGPT')
        .setRequired(true)
    ),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');

    await logGpt(interaction.user, prompt);

    const skidSystemMessage = {
      role: 'system',
      content: SKID_PROMPT,
    };

    try {
      await interaction.deferReply();
      let messages = [{ role: 'user', content: prompt }];

      const isSkid = await skidAlgorithm(prompt);

      const randomPrompt = await randomPromptAlgorithm();

      if (isSkid.error) {
        return await interaction.reply('Error running command', error.message);
      }

      if (isSkid) {
        messages.unshift(skidSystemMessage);
      }

      if (randomPrompt) {
        messages.unshift(randomPrompt);
      }

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      let title = prompt;

      if (title.length > 250) {
        title = title.slice(0, 250) + '...';
      }

      let description = completion.data.choices[0].message.content;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${title}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle('Output: ')
        .setDescription(description)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
        await interaction.editReply(
          'Error running command',
          error.response.data.error.message
        );
      } else {
        console.log(error);
        await interaction.editReply('Error running command', error.message);
      }
    }
  },
};
