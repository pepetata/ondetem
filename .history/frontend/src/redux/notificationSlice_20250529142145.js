import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  type: "",
  message: "",
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotification(state, action) {
      // console.log(`notificatonReducer.js - setNotification action`, action);
      return { type: "", message: "", ...action.payload };
    },
  },
});

// Action creators are generated for each case reducer function

export const { setNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

// const filterReducer = (state = "", action) => {
//   switch (action.type) {
//     case "SET_FILTER":
//       return action.payload;
//     default:
//       return state;
//   }
// };

// export const filterChange = (filter) => {
//   console.log(`filterReducer - filter`, filter);
//   return {
//     type: "SET_FILTER",
//     payload: filter,
//   };
// };

// export default filterReducer;
