import { useState } from "react";
import "./css/App.scss";
import Menu from "./components/Menu";
import UserForm from "./components/UserForm";

const App = () => {
  const [showUserForm, setShowUserForm] = useState(false);

  return (
    <>
      <div className="container">
        <Menu
          onSignup={() => setShowUserForm(true)}
          showUserForm={showUserForm}
        />
        {showUserForm && <UserForm onCancel={() => setShowUserForm(false)} />}
      </div>
      <Routes>
        {/* ...other routes... */}
        <Route path="/signup" element={<UserForm />} />
      </Routes>
    </>
  );
};

export default App;
