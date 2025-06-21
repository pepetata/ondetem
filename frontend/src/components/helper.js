import { setNotification } from "../redux/notificationSlice";

let notificationTimeoutId = null;

export const clearNotification = () => (dispatch) => {
  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
    notificationTimeoutId = null;
  }
  dispatch(setNotification({ type: "", message: null }));
};

export const showNotification =
  (payload, timeout = 5000) =>
  (dispatch) => {
    const critical = payload.type === "critical";
    dispatch(setNotification(payload));
    if (!critical) {
      if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
      notificationTimeoutId = setTimeout(() => {
        dispatch(setNotification({ type: "", message: "" }));
        notificationTimeoutId = null;
      }, timeout);
    }
  };
