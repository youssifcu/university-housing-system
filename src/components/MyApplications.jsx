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

      const res = await getMyApplications();
      // console.log(res.application);
      const app = res?.application
      const appsData = app ? [app] : [];
      // console.log(appsData);

      setApplications(appsData);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this application?')) {
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
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const applicationId = editFormData._id;

      await updateApplication(applicationId, {
        notes: editFormData.notes,
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

      {applications?.length === 0 ? (
        <div className="empty-state-apps">
          <div className="empty-icon-apps">📂</div>
          <h3>No Applications Found</h3>
          <p>You haven't submitted any applications yet.</p>
        </div>
      ) : (
        <div className="apps-cards-grid">
          {applications?.map((app) => (
            <div key={app._id} className="app-card-modern">

              {/* HEADER */}
              <div className="app-card-header">
                <span className="app-id-badge">
                  {String(app._id).substring(0, 8).toUpperCase()}
                </span>

                <span className={`status-tag status-${(app.status || '').toLowerCase()}`}>
                  {app.status}
                </span>
              </div>

              {/* BODY */}
              <div className="app-card-body">

                <div className="app-info-row">
                  <span className="app-info-label">Full Name</span>
                  <span className="app-info-value">{app.fullName}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">National ID</span>
                  <span className="app-info-value">{app.nationalId}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">Gender</span>
                  <span className="app-info-value">{app.gender}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">College</span>
                  <span className="app-info-value">{app.college}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">Academic Year</span>
                  <span className="app-info-value">{app.academicYear}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">GPA</span>
                  <span className="app-info-value">{app.gpa ?? 'N/A'}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">Housing Type</span>
                  <span className="app-info-value">{app.housingType}</span>
                </div>

                <div className="app-info-row">
                  <span className="app-info-label">Date Submitted</span>
                  <span className="app-info-value">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>

              </div>

              {/* FOOTER */}
              {String(app.status).toLowerCase() === 'pending' && (
                <div className="app-card-footer">
                  <button
                    onClick={() => openEditModal(app)}
                    className="btn-edit-app"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleCancel(app._id)}
                    className="btn-cancel-app"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editFormData && (
        <div className="modal-overlay-apps">
          <div className="modal-content-apps">

            <div className="modal-header-apps">
              <h3>Edit Application</h3>
              <button
                className="close-btn-apps"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveEdit} className="modal-form-apps">

              <div className="form-group-apps">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={editFormData.notes || ''}
                  onChange={handleEditChange}
                  rows="3"
                  className="input-apps"
                />
              </div>

              <p className="warning-text-apps">
                You can only edit notes. Other data requires a new application.
              </p>

              <div className="modal-actions-apps">
                <button
                  type="button"
                  className="btn-secondary-apps"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Close
                </button>

                <button type="submit" className="btn-primary-apps">
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;