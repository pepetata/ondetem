import { useSelector } from "react-redux";

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
  return <div className={className}>{message}</div>;
};

export default Notification;
