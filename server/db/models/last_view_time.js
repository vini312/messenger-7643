const Sequelize = require("sequelize");
const db = require("../db");

const LastViewTime = db.define("last_view_time", {
    conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});

module.exports = LastViewTime;
