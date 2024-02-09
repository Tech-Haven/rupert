const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
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
            const numOfCorrectAnswers = quiz.CorrectAnswers.length
            const userSelectedAnswers = []

            // message collector that checks if selected buttons = number of correctAnswers length
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                collectorFilter,
                time: 30_000,
                max: numOfCorrectAnswers
            })

            collector.on('collect', async (int) => {
                userSelectedAnswers.push(int.component.customId)
                
                const btn =  row.components.find((c) => c.data.custom_id === int.component.customId)

                btn.setDisabled(true)

                await interaction.editReply({ embeds: [embed], components: [row] });
            })

            collector.on('end', async () => {
                const correct = arrayEquals(userSelectedAnswers, quiz.CorrectAnswers)

                if (correct) {
                    const correctEmbed = embed.addFields(correctAnswerField)
                    await interaction.editReply({ embeds: [correctEmbed], components: []})
                } else {
                    const incorrectEmbed = embed.addFields(incorrectAnswerField)
                    await interaction.editReply({ embeds: [incorrectEmbed], components: []})
                }
            })
        
        } catch (error) {
            console.error(error)
            if (error.response) {
                console.log(error.response.data)
                console.log(error.response.status)
                console.log(error.response.headers)
                await interaction.editReply(
                    `Error running command: ${error.response.message}`,
                  );
            } else if (error.request) {
                await interaction.editReply(
                    'Request to Quiz API failed. Try again later.',
                  );
            } else {
                await interaction.editReply(
                    `Error running command: ${error.message}`,
                  );
            }
        }
    }
}


const arrayEquals = (a, b) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}