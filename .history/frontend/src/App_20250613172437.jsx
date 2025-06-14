import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./css/App.scss";
import Menu from "./components/Menu";
import UserForm from "./components/UserForm";

const App = () => {
  const [showUserForm, setShowUserForm] = useState(false);

  // Adjust this value to match your navbar height
  const navbarHeight = 100;

  return (
    <>
      <Menu
        onSignup={() => setShowUserForm(true)}
        setShowUserForm={setShowUserForm}
        showUserForm={showUserForm}
      />
      <div className="main-content" style={{ marginTop: navbarHeight }}>
        {showUserForm && <UserForm onCancel={() => setShowUserForm(false)} />}
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route
            path="/signup"
            element={
              <div className="container">
                <UserForm />
              </div>
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
