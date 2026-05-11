import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getMealsWithFilters, bookMeal, getMyMealBookings, deleteMealBooking } from '../../services/mealService';

const mealTypeLabel = (meal) => {
  const t = meal?.mealType || meal?.type || '';
  if (!t) return '—';
  return String(t).charAt(0).toUpperCase() + String(t).slice(1);
};

const formatMealDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const getBookingRecordId = (booking) =>
  booking?.id != null ? String(booking.id) : booking?._id != null ? String(booking._id) : '';

const getEmbeddedMeal = (booking) => {
  const m = booking?.meal;
  if (m && typeof m === 'object') return m;
  const mid = booking?.mealId;
  if (mid && typeof mid === 'object') return mid;
  return null;
};

const bookingMealName = (booking) => {
  const m = getEmbeddedMeal(booking);
  if (m?.name) return m.name;
  return booking?.mealName || booking?.name || '—';
};

const bookingMealDate = (booking) => {
  const m = getEmbeddedMeal(booking);
  return formatMealDate(booking?.date ?? m?.date ?? booking?.mealDate);
};

const bookingMealType = (booking) => {
  const m = getEmbeddedMeal(booking);
  return mealTypeLabel(m || booking);
};

const MemberBookMealsTab = () => {
  const [meals, setMeals] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ date: '', mealType: '' });
  const [bookingMealIdBusy, setBookingMealIdBusy] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const list = await getMyMealBookings();
      setMyBookings(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      setMyBookings([]);
      const msg = String(error.message || '').toLowerCase();
      if (!msg.includes('not found') && !msg.includes('404')) {
        alert(error.message || 'Could not load your bookings.');
      }
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const loadMeals = useCallback(async (nextPage = 1) => {
    setLoading(true);
    try {
      const result = await getMealsWithFilters(nextPage, 15, filtersRef.current);
      setMeals(result.meals || []);
      setTotalPages(Math.max(1, result.totalPages || 1));
      setPage(result.page || nextPage);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Could not load meals.');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeals(1);
    loadBookings();
  }, [loadMeals, loadBookings]);

  const handleBook = async (meal) => {
    const mealId = meal?.id || meal?._id;
    if (!mealId) {
      alert('This meal cannot be booked (missing id).');
      return;
    }

    if (!window.confirm(`Book "${meal.name || 'this meal'}"?`)) {
      return;
    }

    setBookingMealIdBusy(String(mealId));
    try {
      await bookMeal(mealId);
      alert('Meal booked successfully!');
      await loadBookings();
      await loadMeals(page);
    } catch (error) {
      alert(error.message || 'Could not book this meal.');
    } finally {
      setBookingMealIdBusy(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    const bid = getBookingRecordId(booking);
    if (!bid) {
      alert('Cannot cancel this booking (missing id).');
      return;
    }

    if (!window.confirm('Cancel this meal booking?')) {
      return;
    }

    setDeletingBookingId(bid);
    try {
      await deleteMealBooking(bid);
      await loadBookings();
    } catch (error) {
      alert(error.message || 'Could not cancel this booking.');
    } finally {
      setDeletingBookingId(null);
    }
  };

  return (
    <div className="profile-section-modern member-meals-section">
      <div className="member-meals-header">
        <h2>Book a meal</h2>
        <p className="member-meals-sub">
          Choose an upcoming meal and confirm your booking. Your session is used to identify you.
        </p>
      </div>

      <div className="member-bookings-block">
        <h3 className="member-bookings-title">Your bookings</h3>
        <p className="member-meals-sub member-bookings-hint">
          Meals you have reserved. You can cancel a booking before the meal if you want to.
        </p>
        <div className="member-meals-table-wrap">
          {bookingsLoading ? (
            <p className="member-meals-empty">Loading your bookings…</p>
          ) : myBookings.length === 0 ? (
            <p className="member-meals-empty">You have no meal bookings yet.</p>
          ) : (
            <table className="member-meals-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Booking ID</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {myBookings.map((booking) => {
                  const bid = getBookingRecordId(booking);
                  const busy = deletingBookingId === bid;
                  const idPreview =
                    bid.length > 10 ? `${bid.slice(0, 8)}…` : bid || '—';
                  return (
                    <tr key={bid || JSON.stringify(booking)}>
                      <td className="member-meals-name">{bookingMealName(booking)}</td>
                      <td>{bookingMealDate(booking)}</td>
                      <td>
                        <span className="member-meals-type">{bookingMealType(booking)}</span>
                      </td>
                      <td className="member-bookings-id-cell" title={bid || undefined}>
                        {idPreview}
                      </td>
                      <td className="member-meals-actions">
                        <button
                          type="button"
                          className="member-meals-cancel-btn"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={!bid || busy}
                        >
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="member-meals-filters">
        <div className="member-meals-field">
          <label htmlFor="meal-filter-date">Date</label>
          <input
            id="meal-filter-date"
            type="date"
            className="official-input"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="member-meals-field">
          <label htmlFor="meal-filter-type">Meal type</label>
          <select
            id="meal-filter-type"
            className="official-input"
            value={filters.mealType}
            onChange={(e) => setFilters((f) => ({ ...f, mealType: e.target.value }))}
          >
            <option value="">All</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
        <button
          type="button"
          className="member-meals-apply"
          onClick={() => loadMeals(1)}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Apply filters'}
        </button>
      </div>

      <div className="member-meals-table-wrap">
        {loading ? (
          <p className="member-meals-empty">Loading meals…</p>
        ) : (
          <table className="member-meals-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => {
                const id = meal.id || meal._id;
                const idStr = id != null ? String(id) : '';
                const busy = bookingMealIdBusy === idStr;
                return (
                  <tr key={idStr || meal.name}>
                    <td className="member-meals-name">{meal.name || '—'}</td>
                    <td>{formatMealDate(meal.date)}</td>
                    <td>
                      <span className="member-meals-type">{mealTypeLabel(meal)}</span>
                    </td>
                    <td className="member-meals-desc">{meal.description || '—'}</td>
                    <td className="member-meals-actions">
                      <button
                        type="button"
                        className="member-meals-book-btn"
                        onClick={() => handleBook(meal)}
                        disabled={!id || busy}
                      >
                        {busy ? 'Booking…' : 'Book'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && meals.length === 0 && (
          <p className="member-meals-empty">No meals match your filters.</p>
        )}
      </div>

      {!loading && meals.length > 0 && totalPages > 1 && (
        <div className="member-meals-pagination">
          <button
            type="button"
            className="member-meals-page-btn"
            disabled={page <= 1 || loading}
            onClick={() => loadMeals(page - 1)}
          >
            Previous
          </button>
          <span className="member-meals-page-label">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="member-meals-page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => loadMeals(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberBookMealsTab;
