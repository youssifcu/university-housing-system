import { api } from './api';

export const getAllBuildings = async () => {
  try {
    const response = await api.get('/api/buildings');
    return response?.data?.buildings || response?.data || response?.buildings || response || [];
  } catch (error) {
    console.error('Get buildings error:', error);
    throw error;
  }
};

export const getBuildingById = async (buildingId) => {
  try {
    const response = await api.get(`/api/buildings/${buildingId}`);
    return response?.data?.building || response?.building || response;
  } catch (error) {
    console.error('Get building error:', error);
    throw error;
  }
};

export const createBuilding = async (buildingData) => {
  try {
    const response = await api.post('/api/buildings', {
      name: buildingData.name,
      gender: buildingData.gender,
      floors: parseInt(buildingData.floors),
      grade: parseInt(buildingData.grade) || 0,
      description: buildingData.description || '',
      supervisorId: buildingData.supervisorId || '',
      location: buildingData.location || {
        type: 'Point',
        coordinates: [31.2357, 30.0444]
      }
    });
    return response?.data?.building || response?.building || response;
  } catch (error) {
    console.error('Create building error:', error);
    throw error;
  }
};

export const updateBuilding = async (buildingId, buildingData) => {
  try {
    const response = await api.put(`/api/buildings/${buildingId}`, {
      name: buildingData.name,
      gender: buildingData.gender,
      floors: parseInt(buildingData.floors),
      grade: parseInt(buildingData.grade) || 0,
      description: buildingData.description || '',
      supervisorId: buildingData.supervisorId || ''
    });
    return response?.data?.building || response?.building || response;
  } catch (error) {
    console.error('Update building error:', error);
    throw error;
  }
};

export const deleteBuilding = async (buildingId) => {
  try {
    const response = await api.delete(`/api/buildings/${buildingId}`);
    return response;
  } catch (error) {
    console.error('Delete building error:', error);
    throw error;
  }
};
