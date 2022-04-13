// Called when someone joins the guild

module.exports = {
  name: 'guildMemberAdd',
  execute(member) {
    client.commands.get('membercount').update(member.guild);
  },
};
