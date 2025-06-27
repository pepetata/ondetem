// import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./scss/App.scss";
import Menu from "./features/menu/Menu";
import Home from "./features/home/Home";
import UserForm from "./features/users/UserForm";
import LoginForm from "./features/auth/LoginForm";
import AdForm from "./features/ads/AdForm";
import AdView from "./features/ads/AdView";
import Favorites from "./features/favorites/Favorites";
import UserComments from "./features/comments/UserComments";
import ProtectedRoute from "./components/ProtectedRoute";
import Notification from "./components/Notification";
import { useSelector } from "react-redux";
import MyAdsList from "./features/ads/MyAdsList";
import NotFound from "./components/NotFound";
import ErrorDemo from "./components/ErrorDemo";
import ErrorBoundary from "./components/ErrorBoundary";
import DevErrorButton from "./components/DevErrorButton";

const App = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const isHome = location.pathname === "/";
  // const [showUserForm, setShowUserForm] = useState(false);

  // Adjust this value to match your navbar height
  const navbarHeight = 100;

  return (
    <ErrorBoundary>
      <Menu user={user} />
      <Notification />
      <div className="main-content"></div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<UserForm user={user} />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserForm user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/ad/:id/edit"
          element={
            <ProtectedRoute>
              <AdForm />
            </ProtectedRoute>
          }
        />
        <Route path="/ad/view/:title/:id" element={<AdView />} />
        <Route path="/ad/view/:id" element={<AdView />} />
        <Route path="/ad/:id/view" element={<AdView />} />
        <Route
          path="/ad"
          element={
            <ProtectedRoute>
              <AdForm />
            </ProtectedRoute>
          }
        />{" "}
        <Route
          path="/my-ads"
          element={
            <ProtectedRoute>
              <MyAdsList user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-comments"
          element={
            <ProtectedRoute>
              <UserComments />
            </ProtectedRoute>
          }
        />
        {/* Demo route - only show in development */}
        {process.env.NODE_ENV === "development" && (
          <Route path="/error-demo" element={<ErrorDemo />} />
        )}
        {/* Catch-all route for 404 pages */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Development-only floating error button */}
      <DevErrorButton />
    </ErrorBoundary>
  );
};

export default App;
