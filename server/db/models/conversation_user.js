const Sequelize = require("sequelize");
const db = require("../db");

const conversationUser = db.define("conversation_user", {
    conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
},
    {
        indexes: [
            {
                unique: true,
                fields: ['conversationId', 'userId']
            }
        ]
    });

module.exports = conversationUser;
