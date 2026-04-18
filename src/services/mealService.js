import { api } from './api';

export const getMealsWithFilters = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters.date && { date: filters.date }),
      ...(filters.mealType && { mealType: filters.mealType }),
    });
    
    const response = await api.get(`/api/meals?${params}`);
    return {
      meals: response.data.meals || response.data || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      totalPages: response.data.totalPages || 1,
    };
  } catch (error) {
    console.error('Get meals with filters error:', error);
    throw error;
  }
};

export const getAllMeals = async () => {
  try {
    const response = await api.get('/api/meals');
    return response.data || [];
  } catch (error) {
    console.error('Get meals error:', error);
    throw error;
  }
};

export const getMealById = async (mealId) => {
  try {
    const response = await api.get(`/api/meals/${mealId}`);
    return response.data;
  } catch (error) {
    console.error('Get meal error:', error);
    throw error;
  }
};

export const createMeal = async (mealData) => {
  try {
    const mealType = mealData.mealType || mealData.type;
    const response = await api.post('/api/meals', {
      name: mealData.name,
      mealType,
      date: mealData.date,
      description: mealData.description || '',
      nutritionInfo: mealData.nutritionInfo || {}
    });
    return response.data;
  } catch (error) {
    console.error('Create meal error:', error);
    throw error;
  }
};

export const updateMeal = async (mealId, mealData) => {
  try {
    const mealType = mealData.mealType || mealData.type;
    const response = await api.put(`/api/meals/${mealId}`, {
      name: mealData.name,
      mealType,
      date: mealData.date,
      description: mealData.description || '',
      nutritionInfo: mealData.nutritionInfo || {}
    });
    return response.data;
  } catch (error) {
    console.error('Update meal error:', error);
    throw error;
  }
};

export const deleteMeal = async (mealId) => {
  try {
    const response = await api.delete(`/api/meals/${mealId}`);
    return response.data;
  } catch (error) {
    console.error('Delete meal error:', error);
    throw error;
  }
};
