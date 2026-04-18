import { api } from './api';

export const getAllRooms = async () => {
  try {
    const response = await api.get('/api/rooms');
    return response?.data?.rooms || response?.data || response?.rooms || response || [];
  } catch (error) {
    console.error('Get rooms error:', error);
    throw error;
  }
};

export const getAvailableRooms = async () => {
  try {
    const response = await api.get('/api/rooms/available');
    return response?.data?.rooms || response?.data || response?.rooms || response || [];
  } catch (error) {
    console.error('Get available rooms error:', error);
    throw error;
  }
};

export const getRoomById = async (roomId) => {
  try {
    const response = await api.get(`/api/rooms/${roomId}`);
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Get room error:', error);
    throw error;
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await api.post('/api/rooms', {
      roomNumber: roomData.roomNumber,
      buildingId: roomData.buildingId,
      floorNumber: parseInt(roomData.floorNumber),
      capacity: parseInt(roomData.capacity),
      amenities: (roomData.amenities || []).map((amenity) => ({
        name: amenity.name,
        isWorking: Boolean(amenity.isWorking),
      })),
    });
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Create room error:', error);
    throw error;
  }
};

export const updateRoom = async (roomId, roomData) => {
  try {
    const response = await api.put(`/api/rooms/${roomId}`, {
      roomNumber: roomData.roomNumber,
      floorNumber: parseInt(roomData.floorNumber),
      capacity: parseInt(roomData.capacity),
      amenities: (roomData.amenities || []).map((amenity) => ({
        name: amenity.name,
        isWorking: Boolean(amenity.isWorking),
      })),
    });
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Update room error:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const response = await api.delete(`/api/rooms/${roomId}`);
    return response;
  } catch (error) {
    console.error('Delete room error:', error);
    throw error;
  }
};

export const updateRoomStatus = async (roomId, status) => {
  try {
    const response = await api.patch(`/api/rooms/${roomId}/status`, { status });
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Update room status error:', error);
    throw error;
  }
};

export const getMyRoom = async () => {
  try {
    const response = await api.get('/api/rooms/my');
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Get my room error:', error);
    throw error;
  }
};

export const getRoomsByBuilding = async (buildingId) => {
  try {
    const response = await api.get(`/api/rooms/building/${buildingId}`);
    return response?.data?.rooms || response?.data || response?.rooms || response || [];
  } catch (error) {
    console.error('Get rooms by building error:', error);
    throw error;
  }
};

export const assignStudentToRoom = async (roomId, studentId) => {
  const normalizedRoomId = String(roomId || '').trim();
  const normalizedStudentId = String(studentId || '').trim();

  if (!normalizedRoomId) {
    throw new Error('roomId is required');
  }

  if (!normalizedStudentId) {
    throw new Error('studentId is required');
  }

  const endpoint = `/api/rooms/${encodeURIComponent(normalizedRoomId)}/assign`;
  const payload = { studentId: normalizedStudentId };

  const attempts = [
    () => api.patch(endpoint, payload),
    () => api.put(endpoint, payload),
    () => api.post(endpoint, payload),
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      return response?.data?.room || response?.room || response;
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Assign student error:', lastError);
  throw new Error(lastError?.message || 'Failed to assign student');
};

export const removeStudentFromRoom = async (roomId) => {
  try {
    const response = await api.patch(`/api/rooms/${roomId}/remove`, {});
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Remove student error:', error);
    throw error;
  }
};

export const autoAssignRoom = async (studentId) => {
  try {
    const response = await api.post(`/api/rooms/auto-assign/${studentId}`, {});
    return response?.data?.room || response?.room || response;
  } catch (error) {
    console.error('Auto assign room error:', error);
    throw error;
  }
};
