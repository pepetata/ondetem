import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
// import { AuthProvider } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      {/* <AuthProvider> */}
      <App />
      {/* </AuthProvider> */}
    </BrowserRouter>
  </Provider>
);
