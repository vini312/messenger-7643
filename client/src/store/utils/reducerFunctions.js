export const addMessageToStore = (state, payload) => {
  const { message, sender } = payload;
  // if sender isn't null, that means the message needs to be put in a brand new convo
  if (sender !== null) {
    const newConvo = {
      id: message.conversationId,
      otherUser: sender,
      messages: [message],
      lastView: {
        time: message.createdAt,
        count: 0
      },
      latestMessageText: message.text
    };

    return [newConvo, ...state];
  }

  return state.map((convo) => {
    if (convo.id === message.conversationId) {
      return {
        ...convo,
        latestMessageText: message.text,
        messages: [
          ...convo.messages,
          message
        ]
      };
    } else {
      return convo;
    }
  });
};

export const addOnlineUserToStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = true;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const removeOfflineUserFromStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = false;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const addSearchedUsersToStore = (state, users) => {
  const currentUsers = {};

  // make table of current users so we can lookup faster
  state.forEach((convo) => {
    currentUsers[convo.otherUser.id] = true;
  });

  const newState = [...state];
  users.forEach((user) => {
    // only create a fake convo if we don't already have a convo with this user
    if (!currentUsers[user.id]) {
      let fakeConvo = { otherUser: user, messages: [] };
      newState.push(fakeConvo);
    }
  });

  return newState;
};

export const addNewConvoToStore = (state, recipientId, message) => {
  return state.map((convo) => {
    if (convo.otherUser.id === recipientId) {
      return {
        ...convo,
        id: message.conversationId,
        latestMessageText: message.text,
        lastView: {
          ...convo.lastView,
          time: message.createdAt,
          count: 0
        },
        messages: [
          ...convo.messages,
          message
        ]
      };
    } else {
      return convo;
    }
  });
};

export const addLastViewTime = (state, data) => {

  return state.map((convo) => {
    if (convo.id === data.conversationId) {
      let lastView = {};
      // Condition when recipient conversation is open, so time will be updated and other user last message is known
      if (data.otherUserLastMessageId !== null && data.lastViewTime !== null) {
          lastView = {
            time: data.lastViewTime,
            otherUserLastMessageId: data.otherUserLastMessageId,
            count: 0
          }
      }
      // Condition when recipient conversation is NOT open, so add to count and other user last message is known
      else if (data.otherUserLastMessageId !== null && data.count !== null) {
          lastView = {
            ...convo.lastView,
            otherUserLastMessageId: data.otherUserLastMessageId,
            count: convo.lastView.count + 1
          }
      }
      // Condition when recipient conversation is NOT open, so time won't be updated but other user last message is known
      else if (data.otherUserLastMessageId !== null) {
          lastView = {
            ...convo.lastView,
            otherUserLastMessageId: data.otherUserLastMessageId
          }
      }
      // Condition when user is sender, so other user last message won't be updated
      else {
          lastView = {
            ...convo.lastView,
            time: data.lastViewTime,
            count: 0
          }
      }

      return {...convo, lastView}
    } else {
      return convo;
    }
  });
}

