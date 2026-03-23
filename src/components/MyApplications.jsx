import React, { useState, useEffect } from 'react';
import '../styles/MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setApplications([
        {
          id: 'APP-2026-001',
          buildingPreference: 'Building A (Boys)',
          roomType: 'Single Room',
          status: 'Pending',
          submissionDate: '2026-03-14',
          notes: 'Prefer ground floor if possible due to knee pain.'
        },
        {
          id: 'APP-2025-089',
          buildingPreference: 'Building C (Premium)',
          roomType: 'Double Room',
          status: 'Approved',
          submissionDate: '2025-09-01',
          notes: ''
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this housing application?')) {
      setApplications(applications.filter(app => app.id !== id));
    }
  };

  const openEditModal = (app) => {
    setEditFormData({ ...app });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = (e) => {
    e.preventDefault();
    setApplications(applications.map(app => app.id === editFormData.id ? editFormData : app));
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="my-applications-wrapper">
        <div className="loading-state-modern">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="my-applications-wrapper">
      <h2 className="section-title-apps">My Housing Applications</h2>
      
      {applications.length === 0 ? (
        <div className="empty-state-apps">
          <div className="empty-icon-apps">📂</div>
          <h3>No Applications Found</h3>
          <p>You haven't submitted any housing applications yet.</p>
        </div>
      ) : (
        <div className="apps-cards-grid">
          {applications.map((app) => (
            <div key={app.id} className="app-card-modern">
              <div className="app-card-header">
                <span className="app-id-badge">{app.id}</span>
                <span className={`status-tag status-${app.status.toLowerCase()}`}>
                  {app.status}
                </span>
              </div>
              
              <div className="app-card-body">
                <div className="app-info-row">
                  <span className="app-info-label">Building</span>
                  <span className="app-info-value">{app.buildingPreference}</span>
                </div>
                <div className="app-info-row">
                  <span className="app-info-label">Room Type</span>
                  <span className="app-info-value">{app.roomType}</span>
                </div>
                <div className="app-info-row">
                  <span className="app-info-label">Date Submitted</span>
                  <span className="app-info-value">{app.submissionDate}</span>
                </div>
                {app.notes && (
                  <div className="app-info-row app-notes-box">
                    <span className="app-info-label">Notes</span>
                    <span className="app-info-value">{app.notes}</span>
                  </div>
                )}
              </div>

              {app.status === 'Pending' && (
                <div className="app-card-footer">
                  <button onClick={() => openEditModal(app)} className="btn-edit-app">
                    Edit Application
                  </button>
                  <button onClick={() => handleCancel(app.id)} className="btn-cancel-app">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditModalOpen && editFormData && (
        <div className="modal-overlay-apps">
          <div className="modal-content-apps">
            <div className="modal-header-apps">
              <h3>Edit Application {editFormData.id}</h3>
              <button className="close-btn-apps" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={saveEdit} className="modal-form-apps">
              <div className="form-group-apps">
                <label>Building Preference</label>
                <select name="buildingPreference" value={editFormData.buildingPreference} onChange={handleEditChange} className="input-apps" required>
                  <option value="Building A (Boys)">Building A (Boys)</option>
                  <option value="Building B (Girls)">Building B (Girls)</option>
                  <option value="Building C (Premium)">Building C (Premium)</option>
                </select>
              </div>
              <div className="form-group-apps">
                <label>Room Type</label>
                <select name="roomType" value={editFormData.roomType} onChange={handleEditChange} className="input-apps" required>
                  <option value="Single Room">Single Room</option>
                  <option value="Double Room">Double Room</option>
                  <option value="Triple Room">Triple Room</option>
                </select>
              </div>
              <div className="form-group-apps">
                <label>Notes</label>
                <textarea name="notes" value={editFormData.notes} onChange={handleEditChange} rows="3" className="input-apps"></textarea>
              </div>
              <p className="warning-text-apps">Note: To update attached documents, you must cancel and create a new application.</p>
              <div className="modal-actions-apps">
                <button type="button" className="btn-secondary-apps" onClick={() => setIsEditModalOpen(false)}>Close</button>
                <button type="submit" className="btn-primary-apps">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;