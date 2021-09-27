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

export const addLastViewData = (state, data) => {

  return state.map((convo) => {
    if (convo.id === data.conversationId) {
      let lastView;
      // Condition when receives count, to update the unread messages count
      if (data.count !== null) {
        lastView = {
          ...convo.lastView,
          count: convo.lastView.count + 1
        }
      }
      // Condition when receives an otherUserLastMessageId, to update the other user last read message id
      else if (data.otherUserLastMessageId !== null) {
        lastView = {
          ...convo.lastView,
          otherUserLastMessageId: data.otherUserLastMessageId
        }
      }
      // Condition set unread message count to zero (only conversation id is received as argument)
      else {
        lastView = {
          ...convo.lastView,
          count: 0
        }
      }

      return {...convo, lastView}
    } else {
      return convo;
    }
  });
}

