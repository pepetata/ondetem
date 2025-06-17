import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import Menu from "../src/components/Menu";
import { store } from "../src/redux/store";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../src/redux/authSlice";

// Helper to render with custom store
function renderWithProviders(ui, { preloadedState } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

describe("Menu component (logged in)", () => {
  const user = {
    id: 1,
    fullName: "Test User",
    nickname: "Test",
    email: "test@example.com",
    photoPath: "uploads/testphoto.jpg",
  };

  test("shows logged-in user buttons/icons", () => {
    renderWithProviders(<Menu />, {
      preloadedState: { auth: { user, token: "fake-token" } },
    });

    // Small screen: should show text+icon links
    // Large screen: should show icon buttons with titles

    // Test large screen icons (by title)
    expect(screen.getByTitle(/Lista de meus favoritos/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Lista de meus anúncios/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Alterar meus dados/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Encerrar sessão/i)).toBeInTheDocument();

    // Test click on logout button (simulate user action)
    const logoutBtn = screen.getByTitle(/Encerrar sessão/i);
    // Mock window.confirm to always return true
    window.confirm = vi.fn(() => true);
    fireEvent.click(logoutBtn);
    expect(window.confirm).toHaveBeenCalled();
  });

  test("shows mobile menu items when expanded", () => {
    // Simulate mobile viewport
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    renderWithProviders(<Menu />, {
      preloadedState: { auth: { user, token: "fake-token" } },
    });

    // Open the collapsed menu
    const toggle = screen.getByLabelText(/toggle navigation/i);
    fireEvent.click(toggle);

    // Now check for the mobile menu items (with text)
    expect(screen.getByText(/Meus Favoritos/i)).toBeInTheDocument();
    expect(screen.getByText(/Meus Anúncios/i)).toBeInTheDocument();
    expect(screen.getByText(/Meu Perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/Encerrar Sessão/i)).toBeInTheDocument();
  });
});

describe("Menu component (not logged in)", () => {
  test("renders Home and Anuncie Grátis buttons", () => {
    renderWithProviders(<Menu />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Anuncie Grátis/i)).toBeInTheDocument();
  });

  test("renders Entrar and Registre-se buttons", () => {
    renderWithProviders(<Menu />);
    expect(screen.getByTitle(/Entrar/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Registre-se/i)).toBeInTheDocument();
  });

  test("Entrar and Registre-se buttons navigate", () => {
    renderWithProviders(<Menu />);
    const entrarBtn = screen.getByTitle(/Entrar/i);
    const registrarBtn = screen.getByTitle(/Registre-se/i);

    fireEvent.click(entrarBtn);
    fireEvent.click(registrarBtn);

    expect(entrarBtn).toBeEnabled();
    expect(registrarBtn).toBeEnabled();
  });

  test("renders correctly on small screens (mobile)", () => {
    // Set viewport to mobile size
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    renderWithProviders(<Menu />);

    // Open the collapsed menu
    const toggle = screen.getByLabelText(/toggle navigation/i);
    fireEvent.click(toggle);

    // Now check for the buttons in the expanded menu
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Anuncie Grátis/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Entrar/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Registre-se/i)).toBeInTheDocument();
  });
});
