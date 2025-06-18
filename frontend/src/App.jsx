// import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./scss/App.scss";
import Menu from "./components/Menu";
import Home from "./components/Home";
import UserForm from "./features/users/UserForm";
import LoginForm from "./features/auth/LoginForm";
import AdForm from "./features/ads/AdForm";
import { useSelector } from "react-redux";

const App = () => {
  const user = useSelector((state) => state.auth.user);
  // const [showUserForm, setShowUserForm] = useState(false);

  // Adjust this value to match your navbar height
  const navbarHeight = 100;

  return (
    <>
      <Menu user={user} />
      <div className="main-content" style={{ marginTop: navbarHeight }}>
        {/* {showUserForm && <UserForm onCancel={() => setShowUserForm(false)} />} */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<UserForm user={user} />} />
          <Route
            path="/user"
            element={
              user ? <UserForm user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/ad"
            element={
              user ? <AdForm user={user} /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
