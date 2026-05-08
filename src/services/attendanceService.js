import { api } from './api';

export const getAttendanceByBuilding = async (buildingId) => {
  try {
    const response = await api.get(`/api/attendance/building/${buildingId}`);
    const payload = response?.data || response || {};
    const dataNode = payload?.data || {};
    const records = Array.isArray(dataNode?.records)
      ? dataNode.records
      : Array.isArray(payload?.records)
        ? payload.records
        : [];

    return {
      date: dataNode?.date || payload?.date || '',
      buildingId: dataNode?.buildingId || payload?.buildingId || buildingId,
      records,
      stats: dataNode?.stats || payload?.stats || {
        totalRecords: records.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
      },
      pagination: dataNode?.pagination || payload?.pagination || {
        page: 1,
        limit: records.length || 50,
        total: records.length,
        pages: records.length > 0 ? 1 : 0,
      },
    };
  } catch (error) {
    console.error('Get attendance by building error:', error);
    throw error;
  }
};
