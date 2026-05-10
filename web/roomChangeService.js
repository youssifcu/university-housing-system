import { api } from './api';

const extractHousingRequestsList = (response) => {
  const payload = response?.data !== undefined ? response.data : response;
  const nested = payload?.data !== undefined ? payload.data : payload;

  const candidates = [
    nested?.requests,
    nested?.housingRequests,
    nested?.items,
    Array.isArray(nested) ? nested : null,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

const normalizeType = (t) =>
  String(t ?? '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const isRoomChangeShape = (item) => {
  if (!item || typeof item !== 'object') return false;
  return Boolean(
    item.requestedRoomId ||
    item.requestedRoomNumber ||
    item.requestedBuildingId ||
    item.requestedBuildingName ||
    (item.requestedRoom && typeof item.requestedRoom === 'object')
  );
};

const isRoomChangeRequest = (item) => {
  if (!isRoomChangeShape(item)) return false;

  const rawType = item.requestType ?? item.type ?? item.kind ?? item.category;
  if (rawType === undefined || rawType === null || String(rawType).trim() === '') {
    return true;
  }

  const t = normalizeType(rawType);
  if (t.includes('application') && !t.includes('room')) return false;
  if (t.includes('roomchange') || t === 'roomchange') return true;
  if (t.includes('room') && t.includes('change')) return true;

  return isRoomChangeShape(item);
};

const mapRequestRow = (item) => {
  const id = item.id ?? item._id;
  return {
    ...item,
    ...(id != null ? { id: String(id) } : {}),
  };
};

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
    const response = await api.get('/api/housing-requests');
    const list = extractHousingRequestsList(response);
    console.log('list', list);
    const roomChanges = list;
    console.log('roomChanges', roomChanges);
    return roomChanges.map(mapRequestRow);
  } catch (error) {
    console.error('Get all room change requests error:', error);
    throw error;
  }
};

export const updateRoomChangeRequestStatus = async (requestId, status) => {
  try {
    const response = await api.put(`/api/housing-requests/${requestId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update room change request status error:', error);
    throw error;
  }
};
