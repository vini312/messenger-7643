const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const LastViewTime = require("./last_view_time");

// associations

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: "user1" });
Conversation.belongsTo(User, { as: "user2" });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);
LastViewTime.belongsTo(Conversation);
Conversation.hasOne(LastViewTime);

module.exports = {
  User,
  Conversation,
  Message,
  LastViewTime
};
