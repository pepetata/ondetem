// import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./scss/App.scss";
import Menu from "./features/menu/Menu";
import Home from "./features/home/Home";
import UserForm from "./features/users/UserForm";
import LoginForm from "./features/auth/LoginForm";
import AdForm from "./features/ads/AdForm";
import { useSelector } from "react-redux";
import MyAdsList from "./features/ads/MyAdsList";

const App = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const isHome = location.pathname === "/";
  // const [showUserForm, setShowUserForm] = useState(false);

  // Adjust this value to match your navbar height
  const navbarHeight = 100;

  return (
    <>
      <Menu user={user} />
      <div className="main-content" style={{ marginTop: navbarHeight }}></div>
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
          element={user ? <AdForm /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/ad/:id/edit"
          element={user ? <AdForm /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/my-ads"
          element={
            user ? <MyAdsList user={user} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </>
  );
};

export default App;
