import { describe, it, expect, vi } from "vitest";
import {
  ApiError,
  handleApiResponse,
  getDefaultErrorMessage,
  apiFetch,
  handleErrorNotification,
} from "../../src/utils/apiErrorHandler";

// Mock fetch globally
global.fetch = vi.fn();

describe("apiErrorHandler utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  describe("ApiError class", () => {
    it("creates an error with message, status, and data", () => {
      const error = new ApiError("Test error", 400, { field: "email" });

      expect(error.name).toBe("ApiError");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ field: "email" });
    });

    it("creates an error without data", () => {
      const error = new ApiError("Test error", 500);

      expect(error.name).toBe("ApiError");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.data).toBeNull();
    });

    it("extends native Error class", () => {
      const error = new ApiError("Test error", 400);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe("getDefaultErrorMessage function", () => {
    it("returns correct message for 400 status", () => {
      expect(getDefaultErrorMessage(400)).toBe(
        "Dados inválidos. Verifique as informações e tente novamente."
      );
    });

    it("returns correct message for 401 status", () => {
      expect(getDefaultErrorMessage(401)).toBe(
        "Você precisa fazer login para continuar."
      );
    });

    it("returns correct message for 403 status", () => {
      expect(getDefaultErrorMessage(403)).toBe(
        "Você não tem permissão para realizar esta ação."
      );
    });

    it("returns correct message for 404 status", () => {
      expect(getDefaultErrorMessage(404)).toBe(
        "O recurso solicitado não foi encontrado."
      );
    });

    it("returns correct message for 409 status", () => {
      expect(getDefaultErrorMessage(409)).toBe(
        "Conflito nos dados. Este recurso já existe."
      );
    });

    it("returns correct message for 429 status", () => {
      expect(getDefaultErrorMessage(429)).toBe(
        "Muitas tentativas. Aguarde um momento e tente novamente."
      );
    });

    it("returns correct message for 500 status", () => {
      expect(getDefaultErrorMessage(500)).toBe(
        "Erro interno do servidor. Tente novamente mais tarde."
      );
    });

    it("returns correct message for 502, 503, 504 status", () => {
      const expectedMessage =
        "Serviço temporariamente indisponível. Tente novamente em alguns minutos.";
      expect(getDefaultErrorMessage(502)).toBe(expectedMessage);
      expect(getDefaultErrorMessage(503)).toBe(expectedMessage);
      expect(getDefaultErrorMessage(504)).toBe(expectedMessage);
    });

    it("returns generic server error for unknown 5xx status", () => {
      expect(getDefaultErrorMessage(599)).toBe(
        "Erro no servidor. Tente novamente mais tarde."
      );
    });

    it("returns generic client error for unknown 4xx status", () => {
      expect(getDefaultErrorMessage(418)).toBe(
        "Erro na solicitação. Verifique os dados e tente novamente."
      );
    });

    it("returns generic error for unknown status codes", () => {
      expect(getDefaultErrorMessage(200)).toBe(
        "Erro inesperado. Tente novamente."
      );
      expect(getDefaultErrorMessage(300)).toBe(
        "Erro inesperado. Tente novamente."
      );
    });
  });

  describe("handleApiResponse function", () => {
    it("returns parsed JSON for successful response", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      const result = await handleApiResponse(mockResponse);
      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalledOnce();
    });

    it("throws ApiError for failed response with JSON error data", async () => {
      const errorData = {
        error: "Validation failed",
        message: "Email is required",
      };
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(errorData),
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(ApiError);

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error.message).toBe("Email is required");
        expect(error.status).toBe(400);
        expect(error.data).toEqual(errorData);
      }
    });

    it("throws ApiError with default message when no message in error data", async () => {
      const errorData = { error: "Some error" };
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(errorData),
      };

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error.message).toBe("O recurso solicitado não foi encontrado.");
        expect(error.status).toBe(404);
      }
    });

    it("handles JSON parsing errors in error response", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      };

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error.message).toBe("Erro de conexão com o servidor.");
        expect(error.status).toBe(500);
        expect(error.data.error).toBe("Network error");
      }
    });

    it("returns null for successful response that is not JSON", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Not JSON")),
      };

      const result = await handleApiResponse(mockResponse);
      expect(result).toBeNull();
    });
  });

  describe("apiFetch function", () => {
    it("makes successful API call", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiFetch("/api/test");

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockData);
    });

    it("includes custom headers", async () => {
      const mockData = { success: true };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiFetch("/api/test", {
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value",
        },
        method: "POST",
      });

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value",
        },
        method: "POST",
      });
    });

    it("throws ApiError for network errors", async () => {
      const networkError = new TypeError("Failed to fetch");
      fetch.mockRejectedValueOnce(networkError);

      await expect(apiFetch("/api/test")).rejects.toThrow(ApiError);

      try {
        await apiFetch("/api/test");
      } catch (error) {
        expect(error.message).toBe("Erro inesperado. Tente novamente.");
        expect(error.status).toBe(0);
      }
    });

    it("re-throws ApiError instances", async () => {
      const apiError = new ApiError("Custom API error", 400);
      fetch.mockImplementationOnce(() => {
        throw apiError;
      });

      await expect(apiFetch("/api/test")).rejects.toThrow(apiError);
    });

    it("wraps unknown errors", async () => {
      const unknownError = new Error("Unknown error");
      fetch.mockRejectedValueOnce(unknownError);

      try {
        await apiFetch("/api/test");
      } catch (error) {
        expect(error instanceof ApiError).toBe(true);
        expect(error.message).toBe("Erro inesperado. Tente novamente.");
        expect(error.status).toBe(0);
        expect(error.data).toBe(unknownError);
      }
    });
  });

  describe("handleErrorNotification function", () => {
    it("shows ApiError message", () => {
      const showNotification = vi.fn();
      const error = new ApiError("Custom error message", 400);

      handleErrorNotification(error, showNotification);

      expect(showNotification).toHaveBeenCalledWith({
        type: "error",
        message: "Custom error message",
        duration: 5000,
      });
    });

    it("shows network error message for fetch errors", () => {
      const showNotification = vi.fn();
      const error = new Error("Failed to fetch");

      handleErrorNotification(error, showNotification);

      expect(showNotification).toHaveBeenCalledWith({
        type: "error",
        message: "Erro de conexão. Verifique sua internet e tente novamente.",
        duration: 5000,
      });
    });

    it("shows custom error message", () => {
      const showNotification = vi.fn();
      const error = new Error("Custom error");

      handleErrorNotification(error, showNotification);

      expect(showNotification).toHaveBeenCalledWith({
        type: "error",
        message: "Custom error",
        duration: 5000,
      });
    });

    it("shows default message for errors without message", () => {
      const showNotification = vi.fn();
      const error = {};

      handleErrorNotification(error, showNotification);

      expect(showNotification).toHaveBeenCalledWith({
        type: "error",
        message: "Erro inesperado. Tente novamente.",
        duration: 5000,
      });
    });

    it("handles missing showNotification function gracefully", () => {
      const error = new Error("Test error");

      expect(() => {
        handleErrorNotification(error, null);
      }).not.toThrow();

      expect(() => {
        handleErrorNotification(error, undefined);
      }).not.toThrow();
    });
  });

  describe("integration scenarios", () => {
    it("handles complete error flow from API call to notification", async () => {
      const showNotification = vi.fn();
      const errorData = { message: "Email already exists" };
      const mockResponse = {
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue(errorData),
      };

      fetch.mockResolvedValueOnce(mockResponse);

      try {
        await apiFetch("/api/users");
      } catch (error) {
        handleErrorNotification(error, showNotification);

        expect(error instanceof ApiError).toBe(true);
        expect(error.status).toBe(409);
        expect(showNotification).toHaveBeenCalledWith({
          type: "error",
          message: "Email already exists",
          duration: 5000,
        });
      }
    });

    it("handles network error flow", async () => {
      const showNotification = vi.fn();
      fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      try {
        await apiFetch("/api/test");
      } catch (error) {
        handleErrorNotification(error, showNotification);

        expect(showNotification).toHaveBeenCalledWith({
          type: "error",
          message: "Erro de conexão. Verifique sua internet e tente novamente.",
          duration: 5000,
        });
      }
    });
  });
});
