import React from "react";
import { Box, Chip, Typography } from "@material-ui/core";
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
  previewText: (props) => (
    props.unreadTextCount > 0 ?
      {fontWeight: "bold"} :
      {
        fontSize: 12,
        color: "#9CADC8",
        letterSpacing: -0.17,
      }
  ),
  previewTextUnread: {
    fontWeight: "bold"
  },
  unreadTextCount: {
    fontWeight: "bold",
    margin: theme.spacing()
  },
}));

const ChatContent = (props) => {
  const classes = useStyles(props);

  const { conversation, unreadTextCount } = props;
  const { latestMessageText, otherUser } = conversation;

  return (
      <Box className={classes.root}>
        <Box>
          <Typography className={classes.username}>
            {otherUser.username}
          </Typography>
          <Typography className={classes.previewText}>
            {latestMessageText}
          </Typography>
        </Box>
        {unreadTextCount > 0 && <Chip className={classes.unreadTextCount} label={unreadTextCount} color="primary" />}
      </Box>
  );
};

export default ChatContent;
