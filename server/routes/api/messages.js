const router = require("express").Router();
const { Conversation, Message, LastViewTime } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      const message = await Message.create({ senderId, text, conversationId });
      await LastViewTime.update({ conversationId }, {
        where: {
          conversationId,
          userId: senderId,
        }
      });
      return res.json({ message, sender });
    }
    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    let conversation = await Conversation.findConversation(
        senderId,
        recipientId
    );

    if (!conversation) {
      // create conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
      // create last view time for all users in conversation
      LastViewTime.create({
        conversationId: conversation.id,
        userId: senderId
      })
      LastViewTime.create({
        conversationId: conversation.id,
        userId: recipientId
      })
    }
    // wait 5ms to avoid the LastViewTime have the same time as message createdAt and calculate unread count properly
    setTimeout(async () => {
      const message = await Message.create({
        senderId,
        text,
        conversationId: conversation.id,
      });

      res.json({ message, sender });
    },5)

  } catch (error) {
    next(error);
  }
});

module.exports = router;
