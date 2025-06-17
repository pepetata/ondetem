import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../src/redux/userSlice";
import authReducer from "../src/redux/authSlice";
import notificationReducer from "../src/redux/notificationSlice";
import LoginForm from "../src/features/auth/LoginForm";

// Helper to render with providers
function renderWithProviders(ui) {
  const store = configureStore({
    reducer: {
      user: userReducer,
      auth: authReducer,
      notification: notificationReducer,
    },
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

describe("LoginForm", () => {
  test("renders all main fields", () => {
    renderWithProviders(<LoginForm />);
    // Check for email and password fields (adjust label/placeholder as needed)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    // Check for submit button
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
    // Optionally check for "Esqueci minha senha" or other links/buttons
    // expect(screen.getByText(/Esqueci minha senha/i)).toBeInTheDocument();
  });
});
