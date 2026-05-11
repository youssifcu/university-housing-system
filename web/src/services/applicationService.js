import { api, apiMultipart } from './api';

const unwrapPayload = (response) => {
  if (response == null) return null;
  const first = response.data !== undefined ? response.data : response;
  return first?.data !== undefined ? first.data : first;
};

const extractApplicationsList = (response) => {
  const payload = unwrapPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const extractApplicationsPagination = (response, { page, limit }) => {
  const payload = unwrapPayload(response);
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const pagination = source.pagination && typeof source.pagination === 'object' ? source.pagination : {};

  const totalPages =
    pagination.totalPages ??
    source.totalPages ??
    1;

  const currentPage =
    pagination.currentPage ??
    source.page ??
    page;

  const totalItems =
    pagination.totalItems ??
    source.total ??
    source.totalItems ??
    0;

  return {
    currentPage,
    limit,
    totalItems,
    totalPages,
  };
};

const isNoApplicationsError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('not found') ||
    message.includes('no application') ||
    message.includes('no applications')
  );
};

// Submit application with file uploads (multipart/form-data)
export const submitApplication = async (applicationData, files) => {
  try {
    const formData = new FormData();

    formData.append('studentType', applicationData.studentType);
    formData.append('nationalId', applicationData.nationalId);
    formData.append('fullName', applicationData.fullName);
    formData.append('gender', applicationData.gender);
    formData.append('dateOfBirth', applicationData.dateOfBirth);
    formData.append('phoneNumber', applicationData.phoneNumber);
    formData.append('address', applicationData.address);
    formData.append('college', applicationData.college);
    formData.append('academicYear', applicationData.academicYear);
    formData.append('gpa', applicationData.gpa);

    if (files.nationalIdCard) formData.append('nationalIdCard', files.nationalIdCard);
    if (files.personalPhoto) formData.append('personalPhoto', files.personalPhoto);
    if (files.medicalReport) formData.append('medicalReport', files.medicalReport);
    if (files.universityIdCard) formData.append('universityIdCard', files.universityIdCard);

    const response = await apiMultipart('/api/applications', 'POST', formData);
    return response.data;
  } catch (error) {
    console.error('Submit application error:', error);
    throw error;
  }
};

export const getMyApplications = async () => {
  try {
    const response = await api.get('/api/applications/my');
    return response?.data || response?.applications || response || [];
  } catch (error) {
    if (isNoApplicationsError(error)) {
      return [];
    }
    console.error('Get my applications error:', error);
    throw error;
  }
};

// Get all applications with pagination and filters (for admins)
export const getAllApplications = async (page = 1, limit = 10, status = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await api.get(`/api/applications?${params}`);
    return {
      applications: extractApplicationsList(response),
      pagination: extractApplicationsPagination(response, { page, limit }),
    };
  } catch (error) {
    if (isNoApplicationsError(error)) {
      return {
        applications: [],
        pagination: {
          currentPage: page,
          limit: limit,
          totalItems: 0,
          totalPages: 1,
        },
      };
    }
    console.error('Get all applications error:', error);
    throw error;
  }
};

export const getApplicationById = async (applicationId) => {
  try {
    const response = await api.get(`/api/applications/${applicationId}`);
    const payload = unwrapPayload(response);
    return payload?.application ?? payload;
  } catch (error) {
    console.error('Get application error:', error);
    throw error;
  }
};

export const updateApplication = async (applicationId, applicationData) => {
  try {
    const response = await api.put(`/api/applications/${applicationId}`, applicationData);
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Update application error:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, status, payload = {}) => {
  try {
    const normalizedStatus = String(status || '').trim().toLowerCase();

    // Backend docs show PATCH /api/applications/{id}/approve|reject
    if (normalizedStatus === 'approve' || normalizedStatus === 'reject') {
      const body =
        normalizedStatus === 'reject'
          ? {
              ...payload,
              // Support common backend field names
              ...(payload?.reason ? { rejectionReason: payload.reason } : {}),
            }
          : payload;

      const response = await api.patch(
        `/api/applications/${applicationId}/${normalizedStatus}`,
        body
      );
      return unwrapPayload(response) ?? response;
    }

    // Fallback: older endpoints used by some backends (keep compatibility)
    const response = await api.put(`/api/applications/${applicationId}/${normalizedStatus}`);
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Update application status error:', error);
    throw error;
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const response = await api.delete(`/api/applications/${applicationId}`);
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Delete application error:', error);
    throw error;
  }
};
