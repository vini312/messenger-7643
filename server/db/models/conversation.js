const db = require("../db");
const Sequelize = require("sequelize");

const Conversation = db.define("conversation", {
  conversationTitle: {
    type: Sequelize.STRING,
    allowNull: true
  },
});

// find conversation
Conversation.findConversation = async function (convoId) {
  const conversation = await Conversation.findOne({
    where: {
      id: convoId
    }
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

module.exports = Conversation;
