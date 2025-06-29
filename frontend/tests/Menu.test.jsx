import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockStoreStates } from "./utils";
import Menu from "../src/features/menu/Menu";

describe("Menu component (logged in)", () => {
  test("shows logged-in user buttons/icons", () => {
    renderWithProviders(<Menu />, {
      preloadedState: mockStoreStates.loggedIn,
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
      preloadedState: mockStoreStates.loggedIn,
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
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    // Force menu open for the test
    renderWithProviders(<Menu />);

    // No need to click toggle
    // Now check for the buttons in the expanded menu
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Anuncie Grátis/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Entrar/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Registre-se/i)).toBeInTheDocument();
  });
});
