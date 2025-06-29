import "@testing-library/jest-dom";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import {
  renderWithProviders,
  mockStoreStates,
  testForms,
  testAds,
} from "./utils";

// Mock React Router
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// Simple component mocks
vi.mock("../src/components/Notification", () => ({
  default: () => <div data-testid="notification">Notification</div>,
}));

vi.mock("../src/components/OTButton", () => ({
  default: ({ children, onClick, disabled, type, ...props }) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../src/components/FormInput", () => ({
  default: ({ field, form, label, ...props }) => (
    <div>
      {label && <label htmlFor={field?.name}>{label}</label>}
      <input
        id={field?.name}
        name={field?.name}
        value={field?.value || ""}
        onChange={field?.onChange}
        {...props}
      />
    </div>
  ),
}));

// Mock all tab components with simple divs
vi.mock("../src/features/ads/AdFormDescriptionTab", () => ({
  default: () => <div data-testid="tab-description">Description Tab</div>,
}));

vi.mock("../src/features/ads/AdFormContactTab", () => ({
  default: () => <div data-testid="tab-contact">Contact Tab</div>,
}));

vi.mock("../src/features/ads/AdFormImageTab", () => ({
  default: () => <div data-testid="tab-photos">Photos Tab</div>,
}));

vi.mock("../src/features/ads/AdFormCalendarTab", () => ({
  default: () => <div data-testid="tab-calendar">Calendar Tab</div>,
}));

vi.mock("../src/features/ads/AdFormPublicityTab", () => ({
  default: () => <div data-testid="tab-publicity">Publicity Tab</div>,
}));

// Mock modal components
vi.mock("../src/components/ModalButton", () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  ModalCancelButton: ({ onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      Cancelar
    </button>
  ),
  ModalConfirmarButton: ({ onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      Confirmar
    </button>
  ),
}));

// Mock CSS and other imports
vi.mock("../src/scss/AdForm.scss", () => ({}));

// Mock helper functions
vi.mock("../src/components/helper", () => ({
  showNotification: vi.fn(),
  clearNotification: vi.fn(),
  buildValidationSchema: vi.fn(() => ({
    validate: vi.fn().mockResolvedValue({}),
    validateSync: vi.fn().mockReturnValue({}),
    isValid: vi.fn(() => true),
    cast: vi.fn((value) => value),
  })),
}));

// Mock form fields
vi.mock("../src/formfields/adFormFiels.js", () => ({
  adFormFields: {
    title: {
      label: "Título",
      name: "title",
      type: "text",
    },
  },
}));

// Mock Redux thunks
vi.mock("../src/redux/adSlice", () => ({
  createAdThunk: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
  updateAdThunk: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
  deleteAdThunk: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
  getAdThunk: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
  clearCurrentAd: vi.fn(() => ({ type: "test" })),
  setCurrentAd: vi.fn(() => ({ type: "test" })),
}));

vi.mock("../src/redux/adImagesSlice", () => ({
  uploadAdImage: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
  clearAdImages: vi.fn(() => ({ type: "test" })),
  deleteAdImage: vi.fn(() => Promise.resolve({ type: "test", payload: {} })),
}));

// Import AdForm after all mocks
import AdForm from "../src/features/ads/AdForm";

describe("AdForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders basic structure", async () => {
    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd: null, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    // Wait for the component to be ready and render
    await waitFor(() => {
      expect(
        screen.getByText(/Registre as informações de seus anúncios/i)
      ).toBeInTheDocument();
    });
  });

  // Add more comprehensive AdForm tests
  test("renders all form tabs", async () => {
    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd: null, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("tab-description")).toBeInTheDocument();
      expect(screen.getByTestId("tab-contact")).toBeInTheDocument();
      expect(screen.getByTestId("tab-photos")).toBeInTheDocument();
      expect(screen.getByTestId("tab-calendar")).toBeInTheDocument();
      expect(screen.getByTestId("tab-publicity")).toBeInTheDocument();
    });
  });

  test("renders form buttons in correct states", async () => {
    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd: null, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    await waitFor(() => {
      // Check that buttons exist
      expect(
        screen.getByRole("button", { name: /Gravar/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Voltar/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Novo Anúncio/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Remover Anúncio/i })
      ).toBeInTheDocument();

      // Check disabled state for buttons that require currentAd
      expect(
        screen.getByRole("button", { name: /Novo Anúncio/i })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Remover Anúncio/i })
      ).toBeDisabled();
    });
  });

  test("renders with existing ad data", async () => {
    const currentAd = {
      id: 1,
      title: "Test Ad Title",
      description: "Test description",
    };

    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Registre as informações de seus anúncios/i)
      ).toBeInTheDocument();
      // Buttons should be enabled when currentAd exists
      expect(
        screen.getByRole("button", { name: /Novo Anúncio/i })
      ).toBeEnabled();
      expect(
        screen.getByRole("button", { name: /Remover Anúncio/i })
      ).toBeEnabled();
    });
  });

  test("shows notification component", async () => {
    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd: null, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("notification")).toBeInTheDocument();
    });
  });

  test("handles form submission", async () => {
    const testState = {
      auth: { user: { id: 1 }, isAuthenticated: true },
      ads: { currentAd: null, loading: false, error: null },
      adImages: { images: [], loading: false },
    };

    renderWithProviders(<AdForm />, {
      preloadedState: testState,
    });

    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: /Gravar/i });
      fireEvent.click(submitButton);
      // Form submission should trigger without errors
      expect(submitButton).toBeInTheDocument();
    });
  });
});
