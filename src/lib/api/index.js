class ApiClient {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options,
    });
  }

  async postFormData(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      console.log("[API CLIENT] Sending FormData to:", url);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        // Don't set Content-Type for FormData - browser sets it with boundary
        ...options,
      });

      console.log("[API CLIENT] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[API CLIENT] Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("[API CLIENT] Success response:", result);
      return result;
    } catch (error) {
      console.error("[API CLIENT] FormData request failed:", error);
      throw error;
    }
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Update base URL
   * @param {string} newBaseURL - New base URL
   */
  setBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
  }

  /**
   * Update default headers
   * @param {Object} headers - Headers to merge
   */
  setHeaders(headers) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Helper function to handle API errors consistently
export function handleApiError(error, fallbackData = null) {
  console.error("API Error:", error);

  if (fallbackData !== null) {
    console.warn("Using fallback data due to API error");
    return fallbackData;
  }

  throw error;
}
