import axiosClient from './request';

// Get AI Assistant statistics
export const getStatistics = async () => {
  try {
    const response = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/statistics');
    return response.data;
  } catch (error) {
    console.error('Error getting AI Assistant statistics:', error);
    throw error;
  }
};

// Get AI Assistant logs with pagination and filters
export const getLogs = async (params = {}) => {
  try {
    const response = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting AI Assistant logs:', error);
    throw error;
  }
};

// Get a specific AI Assistant log by ID
export const getLogById = async (id) => {
  try {
    const response = await axiosClient.get(`/api/v1/voice-order/log/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting AI Assistant log #${id}:`, error);
    throw error;
  }
};

// Get top filters used in AI Assistant
export const getTopFilters = async () => {
  try {
    const response = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/top-filters');
    return response.data;
  } catch (error) {
    console.error('Error getting top filters:', error);
    throw error;
  }
};

// Get top exclusions used in AI Assistant
export const getTopExclusions = async () => {
  try {
    const response = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/top-exclusions');
    return response.data;
  } catch (error) {
    console.error('Error getting top exclusions:', error);
    throw error;
  }
};

// Update product metadata for AI Assistant
export const updateProductMetadata = async (productId, metadata) => {
  try {
    const response = await axiosClient.post(`/api/v1/dashboard/admin/ai-assistant/products/${productId}/metadata`, metadata);
    return response.data;
  } catch (error) {
    console.error('Error updating product metadata:', error);
    throw error;
  }
};

// Update user AI Assistant credits
export const updateUserCredits = async (userId, credits) => {
  try {
    const response = await axiosClient.post(`/api/v1/dashboard/admin/ai-assistant/users/${userId}/credits`, { credits });
    return response.data;
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
};

export default {
  getStatistics,
  getLogs,
  getLogById,
  getTopFilters,
  getTopExclusions,
  updateProductMetadata,
  updateUserCredits
}; 