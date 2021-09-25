import io from "socket.io-client";
import store from "./store";
import {
  removeOfflineUser,
  addOnlineUser, setLastViewTime,
} from "./store/conversations";
import { messageReceived } from "./store/utils/thunkCreators";

const socket = io(window.location.origin);

socket.on("connect", () => {
  console.log("connected to server");

  socket.on("add-online-user", (id) => {
    store.dispatch(addOnlineUser(id));
  });

  socket.on("remove-offline-user", (id) => {
    store.dispatch(removeOfflineUser(id));
  });

  socket.on("new-message", (data) => {
    // Condition to update only the last viewed message
    if (data.recipientId.otherUserLastMessageId !== undefined)
      store.dispatch(setLastViewTime(data.message.conversationId, {otherUserLastMessageId: data.recipientId.otherUserLastMessageId}));
    // Condition to update all values
    else
      store.dispatch(messageReceived(data));
  });
});

export default socket;
