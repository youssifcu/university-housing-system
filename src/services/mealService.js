import { api } from './api';

const unwrapPayload = (response) => {
  if (response == null) return null;
  const first = response.data !== undefined ? response.data : response;
  return first?.data !== undefined ? first.data : first;
};

const extractMealsList = (response) => {
  const payload = unwrapPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.meals)) return payload.meals;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const extractMealsMeta = (response, fallbackPage) => {
  const payload = unwrapPayload(response);
  const metaSource = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  return {
    total: metaSource.total ?? 0,
    page: metaSource.page ?? fallbackPage,
    totalPages: metaSource.totalPages ?? 1,
  };
};

export const getMealsWithFilters = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters.date && { date: filters.date }),
      ...(filters.mealType && { mealType: filters.mealType }),
    });

    const response = await api.get(`/api/meals?${params}`);
    const meta = extractMealsMeta(response, page);
    return {
      meals: extractMealsList(response),
      total: meta.total,
      page: meta.page,
      totalPages: meta.totalPages,
    };
  } catch (error) {
    console.error('Get meals with filters error:', error);
    throw error;
  }
};

export const getAllMeals = async () => {
  try {
    const response = await api.get('/api/meals');
    return extractMealsList(response);
  } catch (error) {
    console.error('Get meals error:', error);
    throw error;
  }
};

export const getMealById = async (mealId) => {
  try {
    const response = await api.get(`/api/meals/${mealId}`);
    const payload = unwrapPayload(response);
    return payload?.meal ?? payload;
  } catch (error) {
    console.error('Get meal error:', error);
    throw error;
  }
};

export const bookMeal = async (mealId) => {
  const id = String(mealId || '').trim();
  if (!id) {
    throw new Error('mealId is required');
  }

  try {
    const response = await api.post('/api/meals/book', { mealId: id });
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Book meal error:', error);
    throw error;
  }
};

const extractBookingsList = (response) => {
  const payload = unwrapPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getMyMealBookings = async () => {
  try {
    const response = await api.get('/api/meals/my-bookings');
    return extractBookingsList(response);
  } catch (error) {
    console.error('Get my meal bookings error:', error);
    throw error;
  }
};

export const deleteMealBooking = async (bookingId) => {
  const id = String(bookingId || '').trim();
  if (!id) {
    throw new Error('bookingId is required');
  }

  try {
    const response = await api.delete(`/api/meals/book/${id}`);
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Delete meal booking error:', error);
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
    return unwrapPayload(response) ?? response;
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
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Update meal error:', error);
    throw error;
  }
};

export const deleteMeal = async (mealId) => {
  try {
    const response = await api.delete(`/api/meals/${mealId}`);
    return unwrapPayload(response) ?? response;
  } catch (error) {
    console.error('Delete meal error:', error);
    throw error;
  }
};
