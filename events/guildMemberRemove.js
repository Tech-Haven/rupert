// Called when someone leaves the guild

module.exports = {
  name: 'guildMemberRemove',
  execute(member) {
    client.commands.get('membercount').update(member.guild);
  },
};
