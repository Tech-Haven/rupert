const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const {QUIZ_API_URL} = require('../config')

const axios = require('axios')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Request a random quiz from a collection of Comptia practice tests.')
        .addStringOption((option) =>
            option
                .setName('filter')
                .setDescription('Get a question from a specific Comptia exam')
                .addChoices(
                { name: 'a+', value: 'A+' },
                { name: 'network+', value: 'network+' },
                { name: 'security+', value: 'Security+' }
                )
    ),
        
    async execute(interaction) {
        const filter = interaction.options.getString('filter');
        try {
            await interaction.deferReply();
            let url = `${QUIZ_API_URL}`
            filter ?? url.concat(`?tag=${filter}`)
            const res = await axios.get(url)
            const quiz = res.data.data.data[0]

            const last_elem = quiz.Answers.slice(-1)
            const fieldValue = quiz.Answers.map((answ, i) => {
                const letter = String.fromCharCode('a'.charCodeAt(0) + i)
                return `:regional_indicator_${letter}: ${answ}${last_elem == answ ? '' : '\n\n'}`
            })

            const fields = [
                {
                    name: "Select an answer with the reaction buttons below:",
                    value: fieldValue.join('')
                }
            ]

            const correctAnswerField = [
                {
                    name: "Correct!",
                    value: quiz.CorrectAnswers.toString()
                }
            ]

            const incorrectAnswerField = [
                {
                    name: "Sorry, that's incorrect. The answer is: ",
                    value: quiz.CorrectAnswers.toString()
                }
            ]

            const embed = new EmbedBuilder()
                .setDescription(`**${quiz.Question}**`)
                .setFields(fields)
                .setTimestamp()

            const codePoint = 0x1F1E6 // :regional_indicator_a:

            const emojiButtons = quiz.Answers.map((answ, i) => {
                const button = new ButtonBuilder()
                    .setCustomId(answ)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(String.fromCodePoint(codePoint + i))
                
                return button
            })

            const row = new ActionRowBuilder()
                .addComponents(emojiButtons)


            const message = await interaction.editReply({ embeds: [embed], components: [row] });

            const collectorFilter = i => i.user.id === interaction.user.id

            try {
                const confirmation = await message.awaitMessageComponent({filter: collectorFilter, time: 30_000})

                if (quiz.CorrectAnswers.includes(confirmation.customId)){
                    const correctEmbed = embed.addFields(correctAnswerField)
                    await confirmation.update({ embeds: [correctEmbed], components: []})
                } else{
                    const incorrectEmbed = embed.addFields(incorrectAnswerField)
                    await confirmation.update({ embeds: [incorrectEmbed], components: []})
                }

            } catch (error) {
                await interaction.editReply({ content: 'Confirmation not received within 30 seconds, cancelling', components: [] });
            }
        
        } catch (error) {
            console.error(error)
            await interaction.editReply(
                'Error running command',
              );
        }
    }
}