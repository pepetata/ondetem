import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
// import store from "./reducers/store";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <Provider store={store}>
  // <Provider>
  <Router>
    <App />
  </Router>
  // </Provider>
);
