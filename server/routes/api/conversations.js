const router = require("express").Router();
const { User, Conversation, Message, LastViewTime } = require("../../db/models");
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
        {
          model: LastViewTime,
          where :{
            userId: userId
          },
          required: false,
        }
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

      const otherUserLastView = await LastViewTime.findOne({
        where: {
          [Op.and]: {
            userId: convoJSON.otherUser.id,
            conversationId: convoJSON.id
          }
        },
        attributes: ["conversationId", "userId", "updatedAt"]
      });

      // set properties for notification count and latest message preview
      convoJSON.lastView = {
        time: convoJSON.last_view_time.updatedAt,
        count: 0,
        otherUserLastMessageId: convoJSON.messages[0].id
      };

      // Reverse loop, since new messages would be the last elements
      // tempIndex is used to store the index of the message stored at otherUserLastMessageId ( this avoids having 2 separate loops)
      let tempIndex = 0;
      for (let j = convoJSON.messages.length - 1; j >= 0; j--) {
        const countCondition = convoJSON.messages[j].createdAt > convoJSON.last_view_time.updatedAt;
        const otherUserLastMessCondition = convoJSON.messages[j].createdAt <= otherUserLastView.updatedAt;

        if (countCondition)
          convoJSON.lastView.count++;

        // Check if the message is older than last view time and newer than the stored one
        if (otherUserLastMessCondition && convoJSON.messages[j].createdAt > convoJSON.messages[tempIndex].createdAt) {
          tempIndex = j;
          convoJSON.lastView.otherUserLastMessageId = convoJSON.messages[j].id;
        }

        // If both conditions are not met, there is no need to keep iterating
        if (!countCondition && !otherUserLastMessCondition)
          break;
      }
      delete convoJSON.last_view_time;

      convoJSON.latestMessageText = convoJSON.messages[convoJSON.messages.length - 1].text;
        convoSorted[i] = convoJSON;
    }

    res.json(convoSorted);
  } catch (error) {
    next(error);
  }
});

router.put("/lastViewTime", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const {conversationId} = req.body;

    await LastViewTime.update({conversationId}, {
      where: {
        conversationId,
        userId,
      }
    });
    const lastViewTime = await LastViewTime.findAll({
      where: {
        conversationId: conversationId,
        userId: userId,
      }
    });

    return res.json({lastViewTime});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
