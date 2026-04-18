import { api, apiMultipart } from './api';

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
    
    // Add text fields
    formData.append('studentType', applicationData.studentType);
    formData.append('fullName', applicationData.fullName);
    formData.append('gender', applicationData.gender);
    formData.append('dateOfBirth', applicationData.dateOfBirth);
    formData.append('phoneNumber', applicationData.phoneNumber);
    formData.append('address', applicationData.address);
    formData.append('college', applicationData.college);
    formData.append('academicYear', applicationData.academicYear);
    formData.append('gpa', applicationData.gpa);
    formData.append('nationalId', applicationData.nationalId);
    
    // Add files
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
      applications: response.data.applications || response.data || [],
      pagination: response.data.pagination || {
        currentPage: page,
        limit: limit,
        totalItems: 0,
        totalPages: 1,
      },
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
    return response.data;
  } catch (error) {
    console.error('Get application error:', error);
    throw error;
  }
};

export const updateApplication = async (applicationId, applicationData) => {
  try {
    const response = await api.put(`/api/applications/${applicationId}`, applicationData);
    return response.data;
  } catch (error) {
    console.error('Update application error:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const response = await api.put(`/api/applications/${applicationId}/${status}`);
    return response.data;
  } catch (error) {
    console.error('Update application status error:', error);
    throw error;
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const response = await api.delete(`/api/applications/${applicationId}`);
    return response.data;
  } catch (error) {
    console.error('Delete application error:', error);
    throw error;
  }
};
