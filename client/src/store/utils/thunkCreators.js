import axios from "axios";
import socket from "../../socket";
import {
  gotConversations,
  addConversation,
  setNewMessage,
  setSearchedUsers,
  setLastViewData,
} from "../conversations";
import { gotUser, setFetchingStatus } from "../user";
import { setActiveChat } from "../activeConversation";
import store from "../index";

axios.interceptors.request.use(async function (config) {
  const token = await localStorage.getItem("messenger-token");
  config.headers["x-access-token"] = token;

  return config;
});

// USER THUNK CREATORS

export const fetchUser = () => async (dispatch) => {
  dispatch(setFetchingStatus(true));
  try {
    const { data } = await axios.get("/auth/user");
    dispatch(gotUser(data));
    if (data.id) {
      socket.emit("go-online", data.id);
    }
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setFetchingStatus(false));
  }
};

export const register = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/auth/register", credentials);
    await localStorage.setItem("messenger-token", data.token);
    dispatch(gotUser(data));
    socket.emit("go-online", data.id);
  } catch (error) {
    console.error(error);
    dispatch(gotUser({ error: error.response.data.error || "Server Error" }));
  }
};

export const login = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/auth/login", credentials);
    await localStorage.setItem("messenger-token", data.token);
    dispatch(gotUser(data));
    socket.emit("go-online", data.id);
  } catch (error) {
    console.error(error);
    dispatch(gotUser({ error: error.response.data.error || "Server Error" }));
  }
};

export const logout = (id) => async (dispatch) => {
  try {
    await axios.delete("/auth/logout");
    await localStorage.removeItem("messenger-token");
    dispatch(gotUser({}));
    socket.emit("logout", id);
  } catch (error) {
    console.error(error);
  }
};

// CONVERSATIONS THUNK CREATORS

export const fetchConversations = () => async (dispatch) => {
  try {
    const { data } = await axios.get("/api/conversations");
    dispatch(gotConversations(data));
  } catch (error) {
    console.error(error);
  }
};

const saveMessage = async (body) => {
  const { data } = await axios.post("/api/messages", body);
  return data;
};

const updateMessage = async (body) => {
  const { data } = await axios.put("/api/messages", body);
  return data;
}

const sendMessage = (data, body) => {
  socket.emit("new-message", {
    message: data.message,
    recipientId: body.recipientId,
    sender: data.sender,
  });
};

// message format to send: {recipientId, text, conversationId}
// conversationId will be set to null if its a brand new conversation
export const postMessage = (body) => async (dispatch) => {
  try {
    const data = await saveMessage(body);

    if (!body.conversationId) {
      dispatch(addConversation(body.recipientId, data.message));
    } else {
      dispatch(setNewMessage(data.message));
    }

    sendMessage(data, body);
  } catch (error) {
    console.error(error);
  }
};

export const messageReceived = (data) => async (dispatch, getState) => {
  try {
    if (data.recipientId === getState().user.id) {
      const activeConversationUser = getState().activeConversation;

      store.dispatch(setNewMessage(data.message, data.sender));

      // Check if the conversation is already active to edit lastView accordingly
      if (data.message.senderId === activeConversationUser.id) {
        await updateMessage({messageId: data.message.id, read: true});

        // Broadcast to other user the new last viewed message id
        sendMessage(data, {recipientId: {recipientId: data.recipientId, otherUserLastMessageId: data.message.id}});
      } else
          // Update lastView with other user information
        dispatch(setLastViewData(data.message.conversationId, {count: true}));
    }
  } catch (error) {
    console.error(error);
  }
};

export const searchUsers = (searchTerm) => async (dispatch) => {
  try {
    const { data } = await axios.get(`/api/users/${searchTerm}`);
    dispatch(setSearchedUsers(data));
  } catch (error) {
    console.error(error);
  }
};

export const activateChat = (conversation) => async (dispatch) => {
  try {
    if (conversation.id) {
      let lastMessageViewedId = -1;

      for (const message of conversation.messages) {
        if (message.senderId === conversation.otherUser.id) {
          if (!message.read) {
            await updateMessage({messageId: message.id, read: true});
            message.read = true;
          }
          lastMessageViewedId = message.id;
        }
      }

    dispatch(setLastViewData(conversation.id));

    // Broadcast to other user the new last viewed message id
    sendMessage(
        { message: { conversationId:conversation.id }},
        { recipientId: {
            id: conversation.otherUser.id,
            otherUserLastMessageId: lastMessageViewedId
          }});
    }

    dispatch(setActiveChat(conversation.otherUser.username, conversation.otherUser.id));

  } catch (error) {
    console.error(error);
  }
}
