import React from 'react';
import '../../styles/AdminDashboard.css';

const MealsTab = ({
  meals,
  mealPage,
  mealTotalPages,
  mealLimit,
  setMealLimit,
  mealFilters,
  setMealFilters,
  mealLoading,
  loadMeals,
  handleAddMeal,
  handleEditMeal,
  handleDeleteMeal
}) => {
  return (
    <div className="admin-section">
      <div className="admin-stats-row">
        <div className="stat-box">
          <div className="stat-box-icon">🍽️</div>
          <div className="stat-box-data">
            <h3>{meals?.length}</h3>
            <p>Total Meals</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">🌅</div>
          <div className="stat-box-data">
            <h3>{meals?.filter(m => (m.mealType || m.type) === 'breakfast')?.length}</h3>
            <p>Breakfast</p>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon">☀️</div>
          <div className="stat-box-data">
            <h3>{meals?.filter(m => (m.mealType || m.type) === 'lunch')?.length}</h3>
            <p>Lunch</p>
          </div>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Meals Management</h2>
          <button className="btn-primary" onClick={handleAddMeal}>
            + Add New Meal
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Filter by Date</label>
              <input
                type="date"
                value={mealFilters.date}
                onChange={(e) => setMealFilters({ ...mealFilters, date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Filter by Type</label>
              <select
                value={mealFilters.mealType}
                onChange={(e) => setMealFilters({ ...mealFilters, mealType: e.target.value })}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => loadMeals({ page: 1 })}
              disabled={mealLoading}
            >
              {mealLoading ? 'Loading...' : 'Apply Filter'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setMealFilters({ date: '', mealType: '' });
                loadMeals({ page: 1 });
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <label style={{ color: '#64748b' }}>Page</label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadMeals({ page: Math.max(1, mealPage - 1) })}
            disabled={mealPage === 1 || mealLoading}
          >
            Previous
          </button>
          <span style={{ color: '#0f172a', minWidth: '3rem', textAlign: 'center', fontWeight: 600 }}>
            {mealPage} / {mealTotalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadMeals({ page: Math.min(mealTotalPages, mealPage + 1) })}
            disabled={mealPage >= mealTotalPages || mealLoading}
          >
            Next
          </button>
          <label style={{ color: '#64748b', marginLeft: '0.5rem' }}>Rows</label>
          <select
            value={mealLimit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setMealLimit(newLimit);
              loadMeals({ page: 1, limit: newLimit });
            }}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Meals Table */}
        <div className="table-responsive">
          {mealLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading meals...
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Meal Name</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meals?.map((meal) => (
                  <tr key={meal.id}>
                    <td className="fw-bold">{meal.name}</td>
                    <td>{new Date(meal.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill status-${(meal.mealType || meal.type).toLowerCase()}`}>
                        {(meal.mealType || meal.type).charAt(0).toUpperCase() + (meal.mealType || meal.type).slice(1)}
                      </span>
                    </td>
                    <td className="text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meal.description || '—'}
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-icon edit" onClick={() => handleEditMeal(meal)}>Edit</button>
                        <button className="btn-icon delete" onClick={() => handleDeleteMeal(meal.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {meals?.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No meals found. Click "Add New Meal" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealsTab;
