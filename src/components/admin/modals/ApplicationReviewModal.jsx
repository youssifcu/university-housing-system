import React from 'react';

const ApplicationReviewModal = ({
  show,
  selectedApp,
  onClose,
  onUnderReview,
  onReject,
  onApprove,
}) => {
  if (!show || !selectedApp) return null;

  const selectedAppId = selectedApp.id || selectedApp._id;
  const normalizedStatus = String(selectedApp.status || '').toLowerCase();

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal modal-large">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Review Application</h3>
            <span className={`status-pill status-${selectedApp.status.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>
              {selectedApp.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="review-modal-body">
          <div className="review-section">
            <h4>Personal Information</h4>
            <div className="review-grid">
              <div className="review-item"><span className="review-label">Full Name:</span><span className="review-value">{selectedApp.fullName}</span></div>
              <div className="review-item"><span className="review-label">Student ID:</span><span className="review-value">{selectedApp.studentId || selectedApp.student?.studentId || selectedApp.user?.studentId || 'N/A'}</span></div>
              <div className="review-item"><span className="review-label">National ID:</span><span className="review-value">{selectedApp.nationalId || 'N/A'}</span></div>
              <div className="review-item"><span className="review-label">Gender:</span><span className="review-value">{selectedApp.gender}</span></div>
              <div className="review-item"><span className="review-label">Date of Birth:</span><span className="review-value">{new Date(selectedApp.dateOfBirth).toLocaleDateString()}</span></div>
              <div className="review-item"><span className="review-label">Phone:</span><span className="review-value">{selectedApp.phoneNumber}</span></div>
              <div className="review-item full-width"><span className="review-label">Address:</span><span className="review-value">{selectedApp.address}</span></div>
            </div>
          </div>

          <div className="review-section">
            <h4>Academic Information</h4>
            <div className="review-grid">
              <div className="review-item"><span className="review-label">Student Type:</span><span className="review-value">{selectedApp.studentType}</span></div>
              <div className="review-item"><span className="review-label">College:</span><span className="review-value">{selectedApp.college}</span></div>
              <div className="review-item"><span className="review-label">Academic Year:</span><span className="review-value">{selectedApp.academicYear}</span></div>
              <div className="review-item"><span className="review-label">GPA:</span><span className="review-value">{selectedApp.gpa}</span></div>
            </div>
          </div>

          <div className="review-section">
            <h4>Uploaded Documents</h4>
            <div className="documents-preview-grid">
              {selectedApp.nationalIdCardUrl && <div className="doc-preview-item"><p>National ID Card</p><img src={selectedApp.nationalIdCardUrl} alt="National ID" /></div>}
              {selectedApp.personalPhotoUrl && <div className="doc-preview-item"><p>Personal Photo</p><img src={selectedApp.personalPhotoUrl} alt="Personal Photo" /></div>}
              {selectedApp.medicalReportUrl && <div className="doc-preview-item"><p>Medical Report</p><span className="pdf-icon">PDF Document</span></div>}
              {selectedApp.universityIdCardUrl && <div className="doc-preview-item"><p>University ID Card</p><img src={selectedApp.universityIdCardUrl} alt="University ID" /></div>}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          {normalizedStatus === 'pending' && (
            <>
              <button type="button" className="btn-secondary" onClick={() => onUnderReview(selectedAppId)} style={{ padding: '0.75rem 1.5rem' }}>Mark Under Review</button>
              <button type="button" className="btn-icon reject" onClick={() => onReject(selectedAppId)} style={{ padding: '0.75rem 1.5rem' }}>Reject</button>
              <button type="button" className="btn-icon approve" onClick={() => onApprove(selectedAppId)} style={{ padding: '0.75rem 1.5rem' }}>Accept</button>
            </>
          )}
          {normalizedStatus === 'under_review' && (
            <>
              <button type="button" className="btn-icon reject" onClick={() => onReject(selectedAppId)} style={{ padding: '0.75rem 1.5rem' }}>Reject</button>
              <button type="button" className="btn-icon approve" onClick={() => onApprove(selectedAppId)} style={{ padding: '0.75rem 1.5rem' }}>Accept</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationReviewModal;
