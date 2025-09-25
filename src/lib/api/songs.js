import { apiClient, handleApiError } from "./index.js";

// Static fallback data
const STATIC_FRAMES = [
  {
    id: 1,
    ip_id: 1,
    frame_id: 3,
    src: "/frame/FRAME_SHEILAON7_1.png",
    count: 4,
    width: 400,
    height: 600,
  },
  {
    id: 2,
    ip_id: 1,
    frame_id: 2,
    src: "/frame/FRAME_JUMBO_2.png",
    count: 4,
    width: 400,
    height: 600,
  },
  {
    id: 3,
    ip_id: 1,
    frame_id: 3,
    src: "/frame/FRAME_JUMBO_3.png",
    count: 4,
    width: 400,
    height: 600,
  },
  {
    id: 5,
    ip_id: 3,
    frame_id: 1,
    src: "/frame/FRAME_JUMBO_1.png",
    count: 4,
    width: 400,
    height: 600,
  },
  {
    id: 6,
    ip_id: 3,
    frame_id: 2,
    src: "/frame/FRAME_JUMBO_2.png",
    count: 4,
    width: 400,
    height: 600,
  },
  {
    id: 7,
    ip_id: 3,
    frame_id: 3,
    src: "/frame/FRAME_JUMBO_3.png",
    count: 4,
    width: 400,
    height: 600,
  },
];

/**
 * Get all frames
 * @param {boolean} useStatic - Force use static data
 * @returns {Promise<Array>} Array of frame objects
 */
export async function getSongs({ ...args }) {
  try {
    const params = new URLSearchParams();
    const response = await apiClient.get(`/photobox/songs`);
    return response.dataFrames || response.data || response;
  } catch (error) {
    return handleApiError(error, null);
  }
}

/**
 * Get frame by ID
 * @param {number} frameId - Frame ID
 * @returns {Promise<Object|null>} Frame object or null
 */
export async function getSongById(ip_id) {
  try {
    const params = new URLSearchParams();
    params.append("ip_id", ip_id);
    const response = await apiClient.get(
      `/photobox/songs?${params.toString()}`
    );
    return response.frame || response.data || response;
  } catch (error) {
    // Fallback to static data
    const staticFrame = STATIC_FRAMES.find((frame) => frame.id === ip_id);
    return handleApiError(error, staticFrame || null);
  }
}

/**
 * Get frames by IP ID
 * @param {number} ipId - IP ID to filter by
 * @returns {Promise<Array>} Array of frame objects
 */
export async function getSongsByIpId(ipId) {
  try {
    const response = await apiClient.get(`/frames?ip_id=${ipId}`);
    return response.frames || response.data || response;
  } catch (error) {
    // Fallback to static data filtered by ip_id
    const staticFrames = STATIC_FRAMES.filter((frame) => frame.ip_id === ipId);
    return handleApiError(error, staticFrames);
  }
}

/**
 * Create new frame
 * @param {Object} frameData - Frame data
 * @returns {Promise<Object>} Created frame object
 */
export async function createFrame(frameData) {
  try {
    const response = await apiClient.post("/frames", frameData);
    return response.frame || response.data || response;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update frame
 * @param {number} frameId - Frame ID
 * @param {Object} frameData - Updated frame data
 * @returns {Promise<Object>} Updated frame object
 */
export async function updateFrame(frameId, frameData) {
  try {
    const response = await apiClient.put(`/frames/${frameId}`, frameData);
    return response.frame || response.data || response;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete frame
 * @param {number} frameId - Frame ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFrame(frameId) {
  try {
    await apiClient.delete(`/frames/${frameId}`);
    return true;
  } catch (error) {
    handleApiError(error);
    return false;
  }
}

// Export static data for direct access if needed
export { STATIC_FRAMES };
