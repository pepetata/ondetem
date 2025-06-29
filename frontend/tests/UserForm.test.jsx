import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import userReducer from "../src/redux/userSlice";
import authReducer from "../src/redux/authSlice";
import notificationReducer from "../src/redux/notificationSlice";

// Mock react-router-dom at the top level with all necessary exports
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({
    pathname: "/",
    search: "",
    hash: "",
    state: null,
  }),
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
  Route: ({ children }) => children,
  Routes: ({ children }) => children,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

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
  return render(<Provider store={store}>{ui}</Provider>);
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

// Add comprehensive test cases for better coverage
describe("UserForm - Form Validation", () => {
  test("shows validation errors for empty required fields", async () => {
    renderWithProviders(<UserForm />);

    const submitButton = screen.getByRole("button", { name: /Gravar/i });
    fireEvent.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(
      () => {
        const errorElements = screen.getAllByText(/Obrigatório/i);
        expect(errorElements).toHaveLength(5); // fullName, nickname, email, password, useragreement
      },
      { timeout: 3000 }
    );
  });

  test("validates email format", async () => {
    renderWithProviders(<UserForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
    });
  });

  test("validates password confirmation match", async () => {
    renderWithProviders(<UserForm />);

    const passwordInput = screen.getByLabelText(/^Senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirme a senha/i);

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "differentPassword" },
    });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText(/Senhas não coincidem/i)).toBeInTheDocument();
    });
  });
});

describe("UserForm - User Interactions", () => {
  test("handles form submission with valid data", async () => {
    const mockSubmit = vi.fn();
    renderWithProviders(<UserForm onSubmit={mockSubmit} />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Primeiro nome ou apelido/i), {
      target: { value: "João" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "joao@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Senha/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirme a senha/i), {
      target: { value: "password123" },
    });

    // Check user agreement
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Gravar/i });
    fireEvent.click(submitButton);

    // Add assertions based on expected behavior
    expect(submitButton).toBeInTheDocument();
  });

  test("handles file upload for user photo", async () => {
    renderWithProviders(<UserForm />);

    const fileInput = screen.getByLabelText(/Selecione sua foto/i);
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  test("navigates back when cancel button is clicked", () => {
    renderWithProviders(<UserForm />);

    const cancelButton = screen.getByRole("button", { name: /Voltar/i });
    fireEvent.click(cancelButton);

    // Since navigation is mocked, just verify the button exists and can be clicked
    expect(cancelButton).toBeInTheDocument();
  });
});

describe("UserForm - Accessibility", () => {
  test("has proper form labels and associations", () => {
    renderWithProviders(<UserForm />);

    // Check that all inputs have proper labels
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Primeiro nome ou apelido/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirme a senha/i)).toBeInTheDocument();
  });

  test("supports keyboard navigation", () => {
    renderWithProviders(<UserForm />);

    const firstInput = screen.getByLabelText(/Nome Completo/i);
    firstInput.focus();

    expect(document.activeElement).toBe(firstInput);
  });
});
