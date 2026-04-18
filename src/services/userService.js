import { api } from './api';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/me/profile');
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Get profile error:', error);
    try {
      const response = await api.get('/api/users/');
      return response?.data?.user || response?.user || response;
    } catch (fallbackError) {
      console.error('Fallback profile error:', fallbackError);
      throw error; 
    }
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/api/users/profile/update', profileData);
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const getAllUsers = async (params = {}) => {
  try {
    const query = buildQueryString({
      page: params.page,
      limit: params.limit,
      role: params.role,
    });
    const response = await api.get(`/api/users${query}`);
    return response?.data?.users || response?.data || response?.users || response || [];
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}`);
    return response;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/api/users/${userId}`, { role });
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Update role error:', error);
    throw error;
  }
};
