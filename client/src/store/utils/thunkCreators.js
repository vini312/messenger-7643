import axios from "axios";
import socket from "../../socket";
import {
  gotConversations,
  addConversation,
  setNewMessage,
  setSearchedUsers,
  setLastViewTime,
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

const sendMessage = (data, body) => {
  socket.emit("new-message", {
    message: data.message,
    recipientId: body.recipientId,
    sender: data.sender,
  });
};

const updateLastViewTime = async (body) => {
  const { data } = await axios.put("/api/conversations/lastViewTime", body);
  return data;
}

// message format to send: {recipientId, text, conversationId}
// conversationId will be set to null if its a brand new conversation
export const postMessage = (body) => async (dispatch) => {
  try {
    const data = await saveMessage(body);

    if (!body.conversationId) {
      dispatch(addConversation(body.recipientId, data.message));
    } else {
      dispatch(setNewMessage(data.message));
      dispatch(setLastViewTime(body.conversationId, { lastViewTime: data.message.createdAt }));
    }

    sendMessage(data, body);
  } catch (error) {
    console.error(error);
  }
};

export const messageReceived = (data) => async (dispatch, getState) => {
  try {
    const activeConversationUser = getState().activeConversation;

    store.dispatch(setNewMessage(data.message, data.sender));

    // Check if the conversation is already active to edit lastView accordingly
    if (data.message.senderId === activeConversationUser.id) {
      const { lastViewTime } = await updateLastViewTime({conversationId: data.message.conversationId});

      dispatch(setLastViewTime(
          data.message.conversationId,
          { lastViewTime: lastViewTime[0].updatedAt, otherUserLastMessageId: data.message.id }));

      // Broadcast to other user the new last viewed message id
      sendMessage(data,
          {recipientId: {recipientId: data.recipientId, otherUserLastMessageId: data.message.id} });
    }
    else
      // Update lastView with other user information
      dispatch(setLastViewTime(data.message.conversationId, { otherUserLastMessageId: data.message.id, count: true }));

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
  if (conversation.id) {
    const { lastViewTime } = await updateLastViewTime({conversationId: conversation.id});

    dispatch(setLastViewTime(conversation.id, { lastViewTime: lastViewTime[0].updatedAt }));

    // Broadcast to other user the new last viewed message id
    sendMessage(
        { message: { conversationId:conversation.id }},
        { recipientId: {
            id: conversation.otherUser.id,
            otherUserLastMessageId: conversation.messages[conversation.messages.length - 1].id
          }});
  }
  dispatch(setActiveChat(conversation.otherUser.username, conversation.otherUser.id));
}
