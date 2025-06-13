import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import Menu from "./components/Menu";
import Footer from "./components/Footer";
import "./App.css";
import { showNotification } from "./components/helper";
import { initializeBlogs } from "./reducers/blogReducer";
import { getUser } from "./reducers/loginReducer";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchBlogs = async () => {
      dispatch(getUser());
      try {
        await dispatch(initializeBlogs());
      } catch (error) {
        const message = `Error: ${error?.response?.data?.error || error?.message || "Unknown error"}`;
        dispatch(showNotification({ type: "critical", message }));
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="container">
      <Menu />
      <Footer />
    </div>
  );
};

export default App;
