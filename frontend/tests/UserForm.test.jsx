import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../src/redux/userSlice";
import authReducer from "../src/redux/authSlice";
import notificationReducer from "../src/redux/notificationSlice";
import UserForm from "../src/features/users/UserForm";

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
describe("UserForm", () => {
  test("renders all main fields", async () => {
    // await waitFor(() => {
    renderWithProviders(<UserForm />);
    // Check for main fields by label
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Primeiro nome ou apelido/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirme a senha/i)).toBeInTheDocument();
    // Check for user agreement (checkbox)
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    // Check for file input
    expect(screen.getByLabelText(/Selecione sua foto/i)).toBeInTheDocument();
    // Check for submit button
    expect(screen.getByRole("button", { name: /Gravar/i })).toBeInTheDocument();
    // Check for cancel button
    expect(screen.getByRole("button", { name: /Voltar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar/i })).toBeInTheDocument();
    // });
  });

  test("does not render useragreement field when editing existing user", async () => {
    // Simulate an existing user
    const existingUser = {
      id: 123,
      fullName: "Usuário Teste",
      nickname: "Teste",
      email: "teste@example.com",
      password: "",
      confirmpassword: "",
      photo: "",
      useragreement: true,
    };

    renderWithProviders(<UserForm user={existingUser} />);
    // await waitFor(() => {
    // Main fields should be present
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Primeiro nome ou apelido/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirme a senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Selecione sua foto/i)).toBeInTheDocument();
    // useragreement checkbox should NOT be present
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    // Buttons should still be present
    expect(screen.getByRole("button", { name: /Gravar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar/i })).toBeInTheDocument();
    // });
  });
});
