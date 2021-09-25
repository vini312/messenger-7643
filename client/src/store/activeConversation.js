const SET_ACTIVE_CHAT = "SET_ACTIVE_CHAT";

export const setActiveChat = (username, id) => {
  return {
    type: SET_ACTIVE_CHAT,
    payload: { username, id }
  };
};

const reducer = (state = "", action) => {
  switch (action.type) {
    case SET_ACTIVE_CHAT: {
      return action.payload;
    }
    default:
      return state;
  }
};

export default reducer;
