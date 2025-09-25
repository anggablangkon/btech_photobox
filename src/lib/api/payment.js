import { apiClient, handleApiError } from "./index.js";

/**
 * Generate QRIS for payment
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.gross_amount - Total amount
 * @param {string} paymentData.type - Payment type ('photo' or 'extra_print')
 * @param {number} [paymentData.quantity] - Quantity for extra print
 * @returns {Promise<Object>} QRIS data
 */
export async function generateQris(paymentData) {
  try {
    const response = await apiClient.post(
      "/photobox/payment/generateQris",
      paymentData
    );
    return response;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Check payment status
 * @param {string} orderId - Order ID to check
 * @returns {Promise<Object>} Payment status
 */
export async function getPaymentStatus(orderId) {
  try {
    const response = await apiClient.post("/photobox/payment/getStatus", {
      order_id: orderId,
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Generate QRIS for extra print (specific endpoint)
 * @param {Object} extraPrintData - Extra print data
 * @returns {Promise<Object>} QRIS data
 */
export async function generateExtraPrintQris(extraPrintData) {
  try {
    const response = await apiClient.post(
      "/photobox/payment/generateExtraPrintQris",
      {
        ...extraPrintData,
        type: "extra_print",
      }
    );
    return response;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Process photo upload and payment
 * @param {FormData} formData - Form data with photos
 * @returns {Promise<Object>} Upload response
 */
export async function uploadPhotos(formData) {
  try {
    const response = await apiClient.request("/photos/upload", {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Accept: "application/json",
      },
      body: formData,
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
}
