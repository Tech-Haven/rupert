const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const OpenAI= require('openai');
const { logGpt } = require('../utils/log');
const { skidAlgorithm, randomPromptAlgorithm } = require('../utils/utils');
const { SKID_PROMPT } = require('../config/index');

const configuration = {
  organization: 'org-teSKJbo1Bt3jMZnwo9v0A1gb',
  apiKey: process.env.OPENAI_API_KEY,
}

const openai = new OpenAI(configuration);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gpt')
    .setDescription('Talk to ChatGPT using the gpt-4-turbo model!')
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      let title = prompt;

      if (title.length > 250) {
        title = title.slice(0, 250) + '...';
      }

      let description = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${title}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle('Output: ')
        .setDescription(description)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        console.log(error.status);
        console.log(error.data);
        await interaction.editReply(
          'Error running command',
          error.message
        );
      } else {
        console.log(error);
        await interaction.editReply('Error running command', error.message);
      }
    }
  },
};
