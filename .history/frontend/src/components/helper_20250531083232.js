import { setNotification } from "../reducers/notificationReducer";

export const clearNotification = () => (dispatch) => {
  dispatch(setNotification({ type: "", message: null }));
};

export const showNotification =
  (payload, timeout = 5000) =>
  (dispatch) => {
    const critical = payload.type === "critical";
    dispatch(setNotification(payload));
    !critical &&
      setTimeout(() => {
        dispatch(setNotification({ type: "", message: "" }));
      }, timeout);
  };
