import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import AdForm from "../src/features/ads/AdForm";
import userReducer from "../src/redux/userSlice";
import authReducer from "../src/redux/authSlice";
import notificationReducer from "../src/redux/notificationSlice";
import adReducer, { setCurrentAd } from "../src/redux/adSlice";

// Helper to render with providers
function renderWithProviders(ui, { preloadedState } = {}) {
  const store = configureStore({
    reducer: {
      user: userReducer,
      auth: authReducer,
      notification: notificationReducer,
      ads: adReducer,
    },
    preloadedState,
  });
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
    store,
  };
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

  // NEW TESTS

  test("Novo Anúncio and Remover Anúncio buttons are disabled when currentAd is null", () => {
    renderWithProviders(<AdForm />);
    expect(
      screen.getByRole("button", { name: /Novo Anúncio/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Remover Anúncio/i })
    ).toBeDisabled();
  });

  test("Novo Anúncio and Remover Anúncio buttons are enabled when currentAd is set", () => {
    const preloadedState = {
      ads: {
        ads: [],
        userAds: [],
        currentAd: { id: "ad123", title: "Meu anúncio" },
        loading: false,
        error: null,
      },
    };
    renderWithProviders(<AdForm />, { preloadedState });
    expect(
      screen.getByRole("button", { name: /Novo Anúncio/i })
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Remover Anúncio/i })
    ).not.toBeDisabled();
  });

  test("shows unsaved changes modal when trying to go back with dirty form", async () => {
    renderWithProviders(<AdForm />);
    const titleInput = screen.getByLabelText(/Título/i);
    fireEvent.change(titleInput, { target: { value: "Novo título" } });
    fireEvent.click(screen.getByRole("button", { name: /Voltar/i }));
    expect(
      await screen.findByText(/Você tem alterações não salvas/i)
    ).toBeInTheDocument();
  });

  test("shows unsaved changes modal when trying to create new ad with dirty form", async () => {
    const preloadedState = {
      ads: {
        ads: [],
        userAds: [],
        currentAd: { id: "ad123", title: "Meu anúncio" },
        loading: false,
        error: null,
      },
    };
    renderWithProviders(<AdForm />, { preloadedState });
    const titleInput = screen.getByLabelText(/Título/i);
    fireEvent.change(titleInput, { target: { value: "Novo título" } });
    fireEvent.click(screen.getByRole("button", { name: /Novo Anúncio/i }));
    expect(
      await screen.findByText(/Você tem alterações não salvas/i)
    ).toBeInTheDocument();
  });

  test("shows remove confirmation modal when clicking Remover Anúncio", async () => {
    const preloadedState = {
      ads: {
        ads: [],
        userAds: [],
        currentAd: { id: "ad123", title: "Meu anúncio" },
        loading: false,
        error: null,
      },
    };
    renderWithProviders(<AdForm />, { preloadedState });
    fireEvent.click(screen.getByRole("button", { name: /Remover Anúncio/i }));
    expect(
      await screen.findByText(/Tem certeza que deseja remover este anúncio/i)
    ).toBeInTheDocument();
  });

  test("form fields are populated with currentAd data", () => {
    const preloadedState = {
      ads: {
        ads: [],
        userAds: [],
        currentAd: {
          id: "ad123",
          title: "Meu anúncio",
          short: "Breve descrição",
          description: "Descrição completa",
        },
        loading: false,
        error: null,
      },
    };
    renderWithProviders(<AdForm />, { preloadedState });
    expect(screen.getByLabelText(/Título/i)).toHaveValue("Meu anúncio");
    // You can add more assertions for other fields if needed
  });
});
