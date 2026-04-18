import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import { getMyApplications, deleteApplication, updateApplication } from '../services/applicationService';
import '../styles/MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadApplications();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const appsData = await getMyApplications();
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this housing application?')) {
      try {
        await deleteApplication(id);
        await loadApplications();
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application: ' + error.message);
      }
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

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const applicationId = editFormData.id || editFormData._id;
      await updateApplication(applicationId, {
        notes: editFormData.notes
      });
      await loadApplications();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application: ' + error.message);
    }
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
            <div key={app.id || app._id} className="app-card-modern">
              <div className="app-card-header">
                <span className="app-id-badge">{String(app.id || app._id).substring(0, 8).toUpperCase()}</span>
                <span className={`status-tag status-${String(app.status || '').toLowerCase()}`}>
                  {app.status}
                </span>
              </div>
              
              <div className="app-card-body">
                <div className="app-info-row">
                  <span className="app-info-label">Building</span>
                  <span className="app-info-value">{app.buildingName}</span>
                </div>
                <div className="app-info-row">
                  <span className="app-info-label">Room</span>
                  <span className="app-info-value">{app.roomNumber}</span>
                </div>
                <div className="app-info-row">
                  <span className="app-info-label">Room Type</span>
                  <span className="app-info-value">{app.roomType}</span>
                </div>
                <div className="app-info-row">
                  <span className="app-info-label">Date Submitted</span>
                  <span className="app-info-value">
                    {app.submittedAt?.toDate ? 
                      new Date(app.submittedAt.toDate()).toLocaleDateString() : 
                      new Date(app.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                {app.notes && (
                  <div className="app-info-row app-notes-box">
                    <span className="app-info-label">Notes</span>
                    <span className="app-info-value">{app.notes}</span>
                  </div>
                )}
              </div>

              {String(app.status || '').toLowerCase() === 'pending' && (
                <div className="app-card-footer">
                  <button onClick={() => openEditModal(app)} className="btn-edit-app">
                    Edit Application
                  </button>
                  <button onClick={() => handleCancel(app.id || app._id)} className="btn-cancel-app">
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
              <h3>Edit Application {String(editFormData.id || editFormData._id).substring(0, 8).toUpperCase()}</h3>
              <button className="close-btn-apps" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={saveEdit} className="modal-form-apps">
              <div className="form-group-apps">
                <label>Notes</label>
                <textarea name="notes" value={editFormData.notes || ''} onChange={handleEditChange} rows="3" className="input-apps"></textarea>
              </div>
              <p className="warning-text-apps">Note: To change building or room, you must cancel and create a new application.</p>
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