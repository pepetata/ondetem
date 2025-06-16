import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import { Router } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <Router>
      {/* Router is used to handle navigation in the app */}
      <React.StrictMode>
        {/* StrictMode helps identify potential problems in an application */}
        <App />
      </React.StrictMode>
    </Router>
  </Provider>
);
