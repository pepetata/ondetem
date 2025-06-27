/**
 * API Error handling utilities
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Handle API response and throw appropriate errors
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} - Parsed response data
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If JSON parsing fails, create a generic error
      errorData = {
        error: "Network error",
        message: "Erro de conexão com o servidor.",
      };
    }

    const userMessage =
      errorData.message || getDefaultErrorMessage(response.status);
    throw new ApiError(userMessage, response.status, errorData);
  }

  try {
    return await response.json();
  } catch (e) {
    // If response is not JSON, return null
    return null;
  }
};

/**
 * Get a user-friendly error message based on status code
 * @param {number} status - HTTP status code
 * @returns {string} - User-friendly error message
 */
export const getDefaultErrorMessage = (status) => {
  switch (status) {
    case 400:
      return "Dados inválidos. Verifique as informações e tente novamente.";
    case 401:
      return "Você precisa fazer login para continuar.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "O recurso solicitado não foi encontrado.";
    case 409:
      return "Conflito nos dados. Este recurso já existe.";
    case 429:
      return "Muitas tentativas. Aguarde um momento e tente novamente.";
    case 500:
      return "Erro interno do servidor. Tente novamente mais tarde.";
    case 502:
    case 503:
    case 504:
      return "Serviço temporariamente indisponível. Tente novamente em alguns minutos.";
    default:
      if (status >= 500) {
        return "Erro no servidor. Tente novamente mais tarde.";
      } else if (status >= 400) {
        return "Erro na solicitação. Verifique os dados e tente novamente.";
      }
      return "Erro inesperado. Tente novamente.";
  }
};

/**
 * Enhanced fetch with automatic error handling
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data or throws ApiError
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other fetch error
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new ApiError(
        "Erro de conexão. Verifique sua internet e tente novamente.",
        0
      );
    }

    throw new ApiError("Erro inesperado. Tente novamente.", 0, error);
  }
};

/**
 * Show user-friendly error notification
 * @param {Error|ApiError} error - Error object
 * @param {Function} showNotification - Function to show notification (from Redux or context)
 */
export const handleErrorNotification = (error, showNotification) => {
  let message = "Erro inesperado. Tente novamente.";

  if (error instanceof ApiError) {
    message = error.message;
  } else if (error.message) {
    // Check if it's a known error pattern
    if (error.message.includes("fetch") || error.message.includes("network")) {
      message = "Erro de conexão. Verifique sua internet e tente novamente.";
    } else {
      message = error.message;
    }
  }

  if (showNotification) {
    showNotification({
      type: "error",
      message: message,
      duration: 5000,
    });
  }
};
