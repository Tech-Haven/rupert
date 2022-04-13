// Called when comes online

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    client.user.setPresence({ activities: [{ name: `/help` }] });
    console.log(`Logged in as ${client.user.tag}!`);
  },
};
