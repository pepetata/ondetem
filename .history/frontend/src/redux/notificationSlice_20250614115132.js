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
