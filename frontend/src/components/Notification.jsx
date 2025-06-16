import { useSelector } from "react-redux";
import "../scss/Notification.scss";

const Notification = () => {
  const { message, type } = useSelector((state) => state.notification);
  // console.log(`Notification - message`, message, type);

  if (!message) {
    return null;
  }

  let className = "notification"; // Default class

  switch (type) {
    case "critical":
      className += " error";
      break;
    case "error":
      className += " error";
      break;
    case "warning":
      className += " warning";
      break;
    case "success":
      className += " success";
      break;
    default:
      break;
  }

  // console.log(`Notification - class`, className, "type =====", type);
  return message ? <div className={className}>{message}</div> : null;
};

export default Notification;
