import { api, API_BASE_URL, getAuthToken } from './api';
import { removeStudentFromRoom } from './roomService';

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
    const response = await api.get('/api/students/me');
    return response?.data?.student || response?.user || response;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
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

export const getUserProfilePictureUrl = async (userId) => {
  const normalizedUserId = String(userId || '').trim();

  if (!normalizedUserId) {
    return null;
  }

  const token = getAuthToken();
  const headers = token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${encodeURIComponent(normalizedUserId)}/profile-picture`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const imageBlob = await response.blob();

    if (!imageBlob || imageBlob.size === 0) {
      return null;
    }

    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error('Get user profile picture error:', error);
    return null;
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

export const getCurrentUserWithDetails = async () => {
  const profile = await getUserProfile();
  const profileId = profile?.id || profile?._id;

  if (!profileId) {
    return profile;
  }

  try {
    const fullUser = await getUserById(profileId);
    return fullUser || profile;
  } catch (error) {
    console.error('Get current user details error:', error);
    return profile;
  }
};

const normalizeId = (value) => String(value || '').trim();

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response?.data?.user || response?.user || response;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const clearAssignedRoomByStudentId = async (roomId, studentId, providedUser = null) => {
  const normalizedStudentId = normalizeId(studentId);

  if (!normalizedStudentId) {
    throw new Error('studentId is required');
  }

  let lastLookupError = null;

  const findUserAttempts = async () => {
    try {
      const response = await api.get(`/api/users/${normalizedStudentId}`);
      console.log(response.data);

      return response?.data?.user || response?.user || response || null;
    } catch (lookupError) {
      lastLookupError = lookupError;
    }

    const allStudents = await getAllUsers({ limit: 500, role: 'student' });
    return allStudents.find((user) => {
      const userId = normalizeId(user.id || user._id);
      const userStudentId = normalizeId(user.studentId);
      return userId === normalizedStudentId || userStudentId === normalizedStudentId;
    }) || null;
  };

  let matchedUser = providedUser || null;

  if (!matchedUser) {
    try {
      matchedUser = await findUserAttempts();
    } catch (error) {
      lastLookupError = error;
    }
  }

  if (!matchedUser) {
    throw (
      lastLookupError ||
      new Error(`No user found for student ID ${normalizedStudentId}`)
    );
  }

  const userId = matchedUser.id || matchedUser._id;

  if (!userId) {
    throw new Error('Matched user is missing an ID');
  }

  const clearedRoomFields = {
    assignedRoomId: null
  };

  try {
    const response = await api.put(`/api/users/${userId}`, {
      ...matchedUser,
      ...clearedRoomFields,
    });
    await removeStudentFromRoom(roomId, userId);

    return response?.data?.user || response?.user || response;
  } catch (error) {
    throw error || new Error('Failed to clear assigned room data');
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
  const attempts = [
    () => api.patch(`/api/users/${userId}/role`, { role }),
    () => api.put(`/api/users/${userId}/role`, { role }),
    () => api.patch(`/api/users/${userId}`, { role }),
    () => api.put(`/api/users/${userId}`, { role }),
  ];

  let lastError;

  for (const request of attempts) {
    try {
      const response = await request();
      return response?.data?.user || response?.user || response;
    } catch (error) {
      lastError = error;
      console.error('Update role attempt failed:', error);
    }
  }

  throw lastError || new Error('Unable to update role');
};
