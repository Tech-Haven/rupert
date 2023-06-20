const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { logGpt } = require('../utils/log');
const { skidAlgorithm } = require('../utils/utils');

const configuration = new Configuration({
  organization: 'org-teSKJbo1Bt3jMZnwo9v0A1gb',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dalle')
    .setDescription('Generate an image using OpenAI DALL-E')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Prompt for DALL-E')
        .setRequired(true)
    ),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');

    await logGpt(interaction.user, prompt);

    try {
      await interaction.deferReply();

      const response = await openai.createImage({
        prompt: 'A cute baby sea otter',
        n: 2,
        size: '512x512',
      });
      let title = prompt;

      if (title.length > 250) {
        title = title.slice(0, 250) + '...';
      }

      let image = response.data.data[0].url;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${title}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setImage(image)
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
