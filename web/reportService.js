import { api } from './api';

export const getReportsWithFilters = async (page = 1, limit = 20, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
    });

    const response = await api.get(`/api/reports?${params.toString()}`);
    const data = response?.data || response || {};

    return {
      reports: data.reports || data.items || [],
      page: data.page || data.currentPage || page,
      totalPages: data.totalPages || 1,
      total: data.total || data.totalItems || 0,
    };
  } catch (error) {
    console.error('Get reports error:', error);
    throw error;
  }
};

export const getReportById = async (reportId) => {
  try {
    const response = await api.get(`/api/reports/${reportId}`);
    return response?.data || response || null;
  } catch (error) {
    console.error('Get report details error:', error);
    throw error;
  }
};

export const updateMyReport = async (reportId, payload) => {
  try {
    const response = await api.put(`/api/reports/${reportId}`, payload);
    return response?.data || response || null;
  } catch (error) {
    console.error('Update report error:', error);
    throw error;
  }
};

export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/api/reports/${reportId}`);
    return response?.data || response || null;
  } catch (error) {
    console.error('Delete report error:', error);
    throw error;
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const response = await api.patch(`/api/reports/${reportId}/status`, { status });
    return response?.data || response || null;
  } catch (error) {
    console.error('Update report status error:', error);
    throw error;
  }
};
