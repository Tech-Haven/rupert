// Called when someone joins the guild

module.exports = {
  name: 'guildMemberAdd',
  execute(member) {
    member.client.commands.get('membercount').update(member.guild);
  },
};
