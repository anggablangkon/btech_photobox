import { apiClient, handleApiError } from "./index.js";

/**
 * Create order with FormData (multipart/form-data)
 * @param {FormData} formData - FormData containing order data and files
 * @returns {Promise<Object>} Order response
 */
export async function createOrder(formData) {
  console.log("[ORDER API] Creating order with FormData");

  try {
    // Use the new postFormData method
    const response = await apiClient.postFormData(
      "/photobox/order/create",
      formData
    );
    return response;
  } catch (error) {
    console.error("[ORDER API] Create order failed:", error);
    handleApiError(error);
  }
}

/**
 * Get order files
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order files
 */
export async function getOrder(orderId) {
  try {
    const response = await apiClient.get(`/photobox/order/${orderId}/files`);
    return response;
  } catch (error) {
    handleApiError(error);
  }
}

export async function postExtraPrint(formData) {
  console.log("[ORDER API] Creating order with FormData");

  try {
    // Use the new postFormData method
    const response = await apiClient.postFormData(
      "/photobox/order/create-extra-print",
      formData
    );
    return response;
  } catch (error) {
    console.error("[ORDER API] Create order failed:", error);
    handleApiError(error);
  }
}
