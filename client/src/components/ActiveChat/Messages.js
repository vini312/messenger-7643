import React from "react";
import {Avatar, Box} from "@material-ui/core";
import { SenderBubble, OtherUserBubble } from "../ActiveChat";
import moment from "moment";
import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  avatarBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  smallAvatar: {
    height: 20,
    width: 20,
    marginRight: 5,
    marginTop: 6
  },
}));

const Messages = (props) => {
  const { messages, otherUser, lastView, userId } = props;
  const classes = useStyles();

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format("h:mm");

        return <div>
          {message.senderId === userId ? (
            <SenderBubble key={message.id} text={message.text} time={time} otherUser={otherUser} messageId={message.id}
                          lastReadMessageId={lastView.otherUserLastMessageId}/>
        ) : (
            <OtherUserBubble key={message.id} text={message.text} time={time} otherUser={otherUser}/>
        )}
          {lastView.otherUserLastMessageId === message.id &&
          <Box className={classes.avatarBox}>
            <Avatar alt={otherUser.username} src={otherUser.photoUrl} className={classes.smallAvatar}/>
          </Box>}
        </div>
      })}
    </Box>
  );
};

export default Messages;
