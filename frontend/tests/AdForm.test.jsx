import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import AdForm from "../src/features/ads/AdForm";
import userReducer from "../src/redux/userSlice";
import authReducer from "../src/redux/authSlice";
import notificationReducer from "../src/redux/notificationSlice";

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

describe("AdForm", () => {
  test("renders the AdForm title", () => {
    renderWithProviders(<AdForm />);
    expect(
      screen.getByText(/Registre as informações de seus anúncios/i)
    ).toBeInTheDocument();
  });

  test("renders the title input", () => {
    renderWithProviders(<AdForm />);
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
  });

  test("renders the CEP input", () => {
    renderWithProviders(<AdForm />);
    expect(screen.getByPlaceholderText(/CEP/i)).toBeInTheDocument();
  });

  test("shows error when required title is not filled and form is submitted", async () => {
    renderWithProviders(<AdForm />);
    fireEvent.click(screen.getByText(/Gravar/i));
    await waitFor(() => {
      expect(screen.getByText(/Obrigatório/i)).toBeInTheDocument();
    });
  });

  test("shows CEP error when invalid CEP is entered and blurred", async () => {
    renderWithProviders(<AdForm />);
    const cepInput = screen.getByPlaceholderText(/CEP/i);
    fireEvent.change(cepInput, { target: { value: "123" } });
    fireEvent.blur(cepInput);
    await waitFor(() => {
      expect(
        screen.getByText(/Informe o CEP no formato xxxxxxxx ou xxxxx-xxx/i)
      ).toBeInTheDocument();
    });
  });

  test("renders the tabs", () => {
    renderWithProviders(<AdForm />);
    expect(screen.getByRole("tab", { name: /Descrição/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Contato/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Fotos/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Calendário/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Publicidade/i })
    ).toBeInTheDocument();
  });

  test("renders the action buttons", () => {
    renderWithProviders(<AdForm />);
    expect(screen.getByRole("button", { name: /Gravar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Novo Anúncio/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Remover Anúncio/i })
    ).toBeInTheDocument();
  });
});
