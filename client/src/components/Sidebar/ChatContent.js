import React from "react";
import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
  },
  username: {
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  previewText: {
    fontSize: 12,
    color: "#9CADC8",
    letterSpacing: -0.17,
  },
  previewTextUnread: {
    fontSize: 13,
    color: "#000",
    fontWeight: 1000,
    letterSpacing: 0.1,
  },
  unreadTextCount: {
    width: "20%",
    textAlign: "center",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#3A8DFF",
    borderRadius: 20,
    padding: 5,
    margin: 5
  },
}));

const ChatContent = (props) => {
  const classes = useStyles();

  const { conversation, unreadTextCount } = props;
  const { latestMessageText, otherUser } = conversation;

  return (
      <Box className={classes.root}>
        <Box>
          <Typography className={classes.username}>
            {otherUser.username}
          </Typography>
          <Typography className={unreadTextCount > 0? classes.previewTextUnread : classes.previewText}>
            {latestMessageText}
          </Typography>
        </Box>
        {unreadTextCount > 0 &&
        <Typography component="div" className={classes.unreadTextCount}>
          {unreadTextCount}
        </Typography>}
      </Box>
  );
};

export default ChatContent;
