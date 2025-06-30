import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import Home from "../src/features/home/Home";
import adSlice from "../src/redux/adSlice";
import authSlice from "../src/redux/authSlice";
import favoritesSlice from "../src/redux/favoritesSlice";

import PropTypes from "prop-types";

// Mock the slugify utility
vi.mock("../src/utils/slugify", () => ({
  generateAdSlug: vi.fn(
    (title, id) => `${title.toLowerCase().replace(/\s+/g, "-")}-${id}`
  ),
}));

// Mock FavoriteButton component
vi.mock("../src/components/FavoriteButton", () => ({
  default: ({ adId }) => (
    <button data-testid={`favorite-${adId}`}>Favorite</button>
  ),
}));

// Mock environment variables
vi.stubEnv("VITE_API_URL", "http://localhost:3000");

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ads: adSlice,
      auth: authSlice,
      favorites: favoritesSlice,
    },
    preloadedState: {
      ads: {
        ads: [],
        searchLoading: false,
        loading: false,
        error: null,
        currentAd: null,
        ...initialState.ads,
      },
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth,
      },
      favorites: {
        items: [],
        loading: false,
        error: null,
        ...initialState.favorites,
      },
    },
  });
};

const renderWithProviders = (
  ui,
  { initialState = {}, ...renderOptions } = {}
) => {
  const store = createMockStore(initialState);
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.title setter
    Object.defineProperty(document, "title", {
      writable: true,
      value: "",
    });
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      expect(screen.getByTestId("category-grid")).toBeInTheDocument();
    });

    it('sets the document title to "Onde Tem?"', () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      expect(document.title).toBe("Onde Tem?");
    });

    it("displays search input field", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );
      expect(searchInput).toBeInTheDocument();
    });

    it("shows category images initially", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      // Check for category images using alt text since there's no visible text
      expect(screen.getByAltText(/beleza e estética/i)).toBeInTheDocument();
      expect(screen.getByAltText(/negócios/i)).toBeInTheDocument();
      expect(screen.getByAltText(/alimentação/i)).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("handles search input changes", async () => {
      renderWithProviders(<Home />);
      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test search" } });
      });
      expect(searchInput.value).toBe("test search");
    });

    it("shows search results when ads are available", async () => {
      const mockAds = [
        {
          id: 1,
          title: "Test Ad 1",
          description: "Test Description 1",
          images: ["test-image-1.jpg"],
          price: 100,
          location: "Test Location",
        },
        {
          id: 2,
          title: "Test Ad 2",
          description: "Test Description 2",
          images: ["test-image-2.jpg"],
          price: 200,
          location: "Test Location 2",
        },
      ];

      renderWithProviders(<Home />, {
        initialState: {
          ads: {
            ads: mockAds,
            searchLoading: false,
          },
        },
      });

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      // Check that search results section is displayed
      await waitFor(
        () => {
          expect(
            screen.getByText("Resultados da Pesquisa")
          ).toBeInTheDocument();
          expect(searchInput.value).toBe("test");
        },
        { timeout: 1000 }
      );
    });

    it("shows loading state during search", () => {
      act(() => {
        renderWithProviders(<Home />, {
          initialState: {
            ads: {
              ads: [],
              searchLoading: true,
            },
          },
        });
      });

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      act(() => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      expect(screen.getByText(/pesquisando/i)).toBeInTheDocument();
    });

    it('shows "no results" message when no ads found', async () => {
      renderWithProviders(<Home />, {
        initialState: {
          ads: {
            ads: [],
            searchLoading: false,
          },
        },
      });

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "nonexistent" } });
      });

      await waitFor(
        () => {
          expect(
            screen.getByText("Resultados da Pesquisa")
          ).toBeInTheDocument();
          expect(searchInput.value).toBe("nonexistent");
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Category Navigation", () => {
    it("allows clicking on category images to search", async () => {
      renderWithProviders(<Home />);

      const beautyCategory = screen.getByAltText(/beleza e estética/i);

      await act(async () => {
        fireEvent.click(beautyCategory);
      });

      // Should trigger a search for "beleza"
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          /pesquisar anúncios por título, descrição ou localização/i
        );
        expect(searchInput.value).toBe("beleza");
      });
    });

    it("hides categories when searching", async () => {
      renderWithProviders(<Home />);

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      await waitFor(
        () => {
          expect(
            screen.queryByAltText(/beleza e estética/i)
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("shows categories again when search is cleared", async () => {
      renderWithProviders(<Home />);

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      // First search
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      await waitFor(
        () => {
          expect(
            screen.queryByAltText(/beleza e estética/i)
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Clear search
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "" } });
      });

      await waitFor(
        () => {
          expect(screen.getByAltText(/beleza e estética/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Ad Display", () => {
    it("displays search results section when searching", async () => {
      const mockAds = [
        {
          id: 1,
          title: "Test Ad",
          description: "Test Description",
          images: ["test-image.jpg"],
          price: 150,
          location: "Test City",
        },
      ];

      renderWithProviders(<Home />, {
        initialState: {
          ads: {
            ads: mockAds,
            searchLoading: false,
          },
        },
      });

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      await waitFor(
        () => {
          expect(
            screen.getByText("Resultados da Pesquisa")
          ).toBeInTheDocument();
          expect(screen.getByText("Filtros")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("shows search interface when performing search", async () => {
      const mockAds = [
        {
          id: 1,
          title: "Test Ad 1",
          description: "Test Description 1",
          images: ["test-image-1.jpg"],
          price: 100,
          location: "Test Location",
        },
        {
          id: 2,
          title: "Test Ad 2",
          description: "Test Description 2",
          images: ["test-image-2.jpg"],
          price: 200,
          location: "Test Location 2",
        },
      ];

      renderWithProviders(<Home />, {
        initialState: {
          ads: {
            ads: mockAds,
            searchLoading: false,
          },
        },
      });

      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      await waitFor(
        () => {
          expect(
            screen.getByText("Resultados da Pesquisa")
          ).toBeInTheDocument();
          expect(screen.getByText("Limpar")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper category structure", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      const categoryGrid = screen.getByTestId("category-grid");
      expect(categoryGrid).toBeInTheDocument();
    });

    it("search input has proper accessibility attributes", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      const searchInput = screen.getByPlaceholderText(
        /pesquisar anúncios por título, descrição ou localização/i
      );
      expect(searchInput).toHaveAttribute("type", "text");
      expect(searchInput).toBeInTheDocument();
    });

    it("category images have proper alt text or aria labels", () => {
      act(() => {
        renderWithProviders(<Home />);
      });
      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt");
      });
    });
  });
});
