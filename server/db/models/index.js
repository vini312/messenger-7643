const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const ConversationUser = require("./conversation_user");

// associations

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: "user1" });
Conversation.belongsTo(User, { as: "user2" });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);
Conversation.hasMany(ConversationUser);
ConversationUser.belongsTo(Conversation);
ConversationUser.belongsTo(User);

module.exports = {
  User,
  Conversation,
  Message
};
