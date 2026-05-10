import { useState } from 'react';
import { getMealsWithFilters, createMeal, updateMeal, deleteMeal } from '../../services/mealService';

const initialMealFormData = {
  name: '',
  date: '',
  description: '',
  mealType: 'breakfast',
  nutritionInfo: {},
};

export const useAdminMealsLogic = () => {
  const [meals, setMeals] = useState([]);
  const [mealPage, setMealPage] = useState(1);
  const [mealLimit, setMealLimit] = useState(10);
  const [mealTotalPages, setMealTotalPages] = useState(1);
  const [mealFilters, setMealFilters] = useState({ date: '', mealType: '' });
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealFormData, setMealFormData] = useState(initialMealFormData);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealSubmitting, setMealSubmitting] = useState(false);

  const loadMeals = async (overrides = {}) => {
    try {
      setMealLoading(true);
      const currentPage = overrides.page ?? mealPage;
      const currentLimit = overrides.limit ?? mealLimit;
      const currentFilters = overrides.filters ?? mealFilters;
      const result = await getMealsWithFilters(currentPage, currentLimit, currentFilters);
      setMeals(result.meals);
      setMealTotalPages(result.totalPages);
      setMealPage(result.page);
    } catch (error) {
      alert('Error loading meals: ' + error.message);
    } finally {
      setMealLoading(false);
    }
  };

  const handleCreateMeal = () => {
    setSelectedMeal(null);
    setMealFormData(initialMealFormData);
    setShowMealModal(true);
  };

  const handleEditMeal = (meal) => {
    setSelectedMeal(meal);
    setMealFormData({
      name: meal.name,
      date: meal.date,
      description: meal.description || '',
      mealType: meal.mealType || meal.type || 'breakfast',
      nutritionInfo: meal.nutritionInfo || {},
    });
    setShowMealModal(true);
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!mealFormData.name || !mealFormData.date || !mealFormData.mealType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setMealSubmitting(true);
      const selectedMealId = selectedMeal?.id || selectedMeal?._id;
      if (selectedMeal) {
        if (!selectedMealId) throw new Error('Invalid meal ID');
        await updateMeal(selectedMealId, { ...mealFormData, type: mealFormData.mealType });
        alert('Meal updated successfully!');
      } else {
        await createMeal({ ...mealFormData, type: mealFormData.mealType });
        alert('Meal created successfully!');
      }

      setShowMealModal(false);
      await loadMeals();
    } catch (error) {
      alert('Error saving meal: ' + error.message);
    } finally {
      setMealSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!mealId) return alert('Invalid meal ID');
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await deleteMeal(mealId);
        alert('Meal deleted successfully!');
        await loadMeals();
      } catch (error) {
        alert('Error deleting meal: ' + error.message);
      }
    }
  };

  return {
    meals,
    mealPage,
    mealLimit,
    mealTotalPages,
    mealFilters,
    showMealModal,
    selectedMeal,
    mealFormData,
    mealLoading,
    mealSubmitting,
    setMealLimit,
    setMealFilters,
    setShowMealModal,
    setMealFormData,
    loadMeals,
    handleCreateMeal,
    handleEditMeal,
    handleDeleteMeal,
    handleMealSubmit,
  };
};
