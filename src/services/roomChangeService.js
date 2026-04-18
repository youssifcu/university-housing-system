import { api } from './api';

export const submitRoomChangeRequest = async (requestData) => {
  try {
    const response = await api.post('/api/room-change-requests', {
      requestedRoomId: requestData.requestedRoomId,
      requestedBuildingId: requestData.requestedBuildingId,
      reason: requestData.reason
    });
    return response.data;
  } catch (error) {
    console.error('Submit room change request error:', error);
    throw error;
  }
};

export const getMyRoomChangeRequests = async () => {
  try {
    const response = await api.get('/api/room-change-requests/my-requests');
    return response.data || [];
  } catch (error) {
    console.error('Get my room change requests error:', error);
    throw error;
  }
};

export const getAllRoomChangeRequests = async () => {
  try {
    const response = await api.get('/api/room-change-requests');
    return response.data || [];
  } catch (error) {
    console.error('Get all room change requests error:', error);
    throw error;
  }
};

export const updateRoomChangeRequestStatus = async (requestId, status) => {
  try {
    const response = await api.put(`/api/room-change-requests/${requestId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update room change request status error:', error);
    throw error;
  }
};
