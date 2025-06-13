import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import "./css/global.scss";
import Menu from "./components/Menu";
// import Menu from "./components/Menu";
// import Footer from "./components/Footer";
// import "./App.css";
// import { showNotification } from "./components/helper";
// import { initializeBlogs } from "./reducers/blogReducer";
// import { getUser } from "./reducers/loginReducer";

const App = () => {
  return (
    <div className="container">
      <Menu />
    </div>
  );
};

export default App;
