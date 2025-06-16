import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import authReducer from "./authSlice";
import notificationReducer from "./notificationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    notification: notificationReducer,
    auth: authReducer,
  },
});
