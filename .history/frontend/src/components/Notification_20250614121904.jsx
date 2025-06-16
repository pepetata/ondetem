const Notification = () => {
  const { message, type } = useSelector((state) => state.notification);

  if (!message) return null;

  return <div className={`notification ${type}`}>{message}</div>;
};

export default Notification;
