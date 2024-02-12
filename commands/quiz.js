const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ActionRow, Embed } = require('discord.js');
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

            const questionEmbed = new EmbedBuilder()
                .setTitle("Question")
                .setDescription(`**${quiz.Question}**`)
                .setTimestamp()

            const choicesEmbed = new EmbedBuilder()
                .setTitle("Choices")
                .setDescription(fieldValue.join(''))
                .setFooter({text: "Timeout after 30 seconds"}) 

            const codePoint = 0x1F1E6 // :regional_indicator_a:

            const choicesMap = new Map()

            const emojiButtons = quiz.Answers.map((answ, i) => {
                choicesMap.set(i.toString(), answ)
                const button = new ButtonBuilder()
                    .setCustomId(i.toString())
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(String.fromCodePoint(codePoint + i))
                
                return button
            })

            const chunkedArray = chunkArray(emojiButtons, 5);

            const components = chunkedArray.map((a) => {
                return new ActionRowBuilder().addComponents(a)
            })

            const message = await interaction.editReply({ embeds: [questionEmbed, choicesEmbed], components });

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
                
                const btn = emojiButtons.find((c) => c.data.custom_id === int.component.customId)

                btn.setDisabled(true)

                await int.update({ components });
            })

            collector.on('end', async () => {
                const correct = arrayEquals(userSelectedAnswers, quiz.CorrectAnswers, choicesMap)

                if (correct) {
                    const correctEmbed = choicesEmbed.addFields(correctAnswerField).setFooter({text: null})
                    await interaction.editReply({ embeds: [questionEmbed, correctEmbed], components: []})
                } else {
                    const incorrectEmbed = choicesEmbed.addFields(incorrectAnswerField).setFooter({text: null})
                    await interaction.editReply({ embeds: [questionEmbed, incorrectEmbed], components: []})
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


const arrayEquals = (a, b, choicesMap) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => choicesMap.get(val) === b[index]);
}

const chunkArray = (array, chunkSize) => {
    let result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }