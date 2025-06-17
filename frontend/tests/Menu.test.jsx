import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import Menu from "../src/components/Menu";
import { store } from "../src/redux/store";

// Helper to render with providers
function renderWithProviders(ui) {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

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
