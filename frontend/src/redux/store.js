import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import authReducer from "./authSlice";
import notificationReducer from "./notificationSlice";
import adReducer from "./adSlice";
import adImagesReducer from "./adImagesSlice";
import favoritesReducer from "./favoritesSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    notification: notificationReducer,
    auth: authReducer,
    ads: adReducer,
    adImages: adImagesReducer,
    favorites: favoritesReducer,
  },
});
