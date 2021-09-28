const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id"],
      order: [[Message, "createdAt", "ASC"]],
      include: [
        { model: Message },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    // Reorder the conversations according to the last message sent/received
    const convoSorted = conversations.sort((a,b) => {
        const convoA = a?.messages?.length > 0 ? a?.messages[a.messages.length - 1]?.createdAt : undefined;
        const convoB = b?.messages?.length > 0 ? b?.messages[b.messages.length - 1]?.createdAt : undefined;

        // condition for the last element
        if (convoA !== undefined && convoB === undefined)
            return -1;

        // condition for the first element
        if (convoA === undefined && convoB !== undefined)
            return 1;

        // condition for comparing two elements
        if (convoA !== undefined && convoB !== undefined && convoA !== convoB)
            return convoA < convoB ? 1 : -1;

        // return 0 if the elements are equal
        return 0;
    })

    for (let i = 0; i < convoSorted.length; i++) {
      const convo = convoSorted[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      convoJSON.lastView = {
        count: 0,
        otherUserLastMessageId: 0
      };

      for (const message of convoJSON.messages) {
        if (message.senderId !== userId) {
          if (!message.read)
            convoJSON.lastView.count++;
        }
        else if (message.read)
          convoJSON.lastView.otherUserLastMessageId = message.id;
      }

      convoJSON.latestMessageText = convoJSON.messages[convoJSON.messages.length - 1].text;
        convoSorted[i] = convoJSON;
    }

    res.json(convoSorted);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
