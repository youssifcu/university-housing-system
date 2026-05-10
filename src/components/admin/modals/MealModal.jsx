import React from 'react';

const MealModal = ({
  show,
  selectedMeal,
  mealFormData,
  setMealFormData,
  onClose,
  onSubmit,
  mealSubmitting,
}) => {
  if (!show) return null;

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal">
        <div className="modal-header">
          <h3>{selectedMeal ? 'Edit Meal' : 'Add New Meal'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Meal Name *</label>
            <input
              type="text"
              value={mealFormData.name}
              onChange={(e) => setMealFormData({ ...mealFormData, name: e.target.value })}
              required
              className="form-input"
              placeholder="e.g. Grilled Chicken with Rice"
            />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={mealFormData.date}
              onChange={(e) => setMealFormData({ ...mealFormData, date: e.target.value })}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Meal Type *</label>
            <select
              value={mealFormData.mealType}
              onChange={(e) => setMealFormData({ ...mealFormData, mealType: e.target.value })}
              required
              className="form-input"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={mealFormData.description}
              onChange={(e) => setMealFormData({ ...mealFormData, description: e.target.value })}
              rows="3"
              className="form-input"
              placeholder="Brief description of the meal..."
            />
          </div>
          <div className="form-group">
            <label>Nutritional Info (JSON)</label>
            <textarea
              value={JSON.stringify(mealFormData.nutritionInfo, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setMealFormData({ ...mealFormData, nutritionInfo: parsed });
                } catch {
                  // ignore invalid JSON
                }
              }}
              rows="4"
              className="form-input"
              placeholder='{"calories": 500, "protein": "30g"}'
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={mealSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={mealSubmitting}>
              {mealSubmitting ? 'Saving...' : (selectedMeal ? 'Update Meal' : 'Create Meal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealModal;
