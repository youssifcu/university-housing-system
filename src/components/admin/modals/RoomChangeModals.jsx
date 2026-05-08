import React from 'react';

export const RoomChangeReviewModal = ({
  show,
  selectedRequest,
  onClose,
  onReject,
  onApprove,
}) => {
  if (!show || !selectedRequest) return null;

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal modal-large">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Review Room Change Request</h3>
            <span className={`status-pill status-${selectedRequest.status.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>
              {selectedRequest.status}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="review-modal-body">
          <div className="review-section">
            <h4>Student Information</h4>
            <div className="review-grid">
              <div className="review-item"><span className="review-label">Name:</span><span className="review-value">{selectedRequest.studentName}</span></div>
              <div className="review-item"><span className="review-label">Email:</span><span className="review-value">{selectedRequest.userEmail}</span></div>
              <div className="review-item"><span className="review-label">Current Room:</span><span className="review-value">{selectedRequest.currentRoomId ? 'Assigned' : 'Not Assigned'}</span></div>
            </div>
          </div>

          <div className="review-section">
            <h4>Requested Room</h4>
            <div className="review-grid">
              <div className="review-item"><span className="review-label">Building:</span><span className="review-value">{selectedRequest.requestedBuildingName}</span></div>
              <div className="review-item"><span className="review-label">Room Number:</span><span className="review-value">{selectedRequest.requestedRoomNumber}</span></div>
            </div>
          </div>

          <div className="review-section">
            <h4>Reason for Change</h4>
            <div className="review-grid">
              <div className="review-item full-width">
                <span className="review-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.reason}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          {selectedRequest.status === 'Pending' && (
            <>
              <button type="button" className="btn-icon reject" onClick={() => onReject(selectedRequest.id)} style={{ padding: '0.75rem 1.5rem' }}>Reject</button>
              <button type="button" className="btn-icon approve" onClick={() => onApprove(selectedRequest)} style={{ padding: '0.75rem 1.5rem' }}>Approve & Assign</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminRoomChangeModal = ({
  show,
  selectedUserForRoomChange,
  onClose,
  onSubmit,
  adminRoomChangeData,
  setAdminRoomChangeData,
  buildings,
  rooms,
}) => {
  if (!show || !selectedUserForRoomChange) return null;

  return (
    <div className="enterprise-modal-overlay">
      <div className="enterprise-modal">
        <div className="modal-header">
          <h3>Change User Room - {selectedUserForRoomChange.fullName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Current Room</label>
            <input
              type="text"
              value={selectedUserForRoomChange.currentRoomNumber ? `${selectedUserForRoomChange.currentBuildingName} - Room ${selectedUserForRoomChange.currentRoomNumber}` : 'Not Assigned'}
              disabled
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Select New Building</label>
            <select
              name="buildingId"
              value={adminRoomChangeData.buildingId}
              onChange={(e) => setAdminRoomChangeData({ ...adminRoomChangeData, buildingId: e.target.value, roomId: '' })}
              required
              className="form-input"
            >
              <option value="">Choose a building...</option>
              {buildings?.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} ({building.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select New Room</label>
            <select
              name="roomId"
              value={adminRoomChangeData.roomId}
              onChange={(e) => setAdminRoomChangeData({ ...adminRoomChangeData, roomId: e.target.value })}
              required
              disabled={!adminRoomChangeData.buildingId}
              className="form-input"
            >
              <option value="">Choose a room...</option>
              {rooms?.filter((room) => room.buildingId === adminRoomChangeData.buildingId).map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - Floor {room.floorNumber} ({room.currentOccupancy}/{room.capacity} occupied)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Reason for Room Change</label>
            <textarea
              name="reason"
              value={adminRoomChangeData.reason}
              onChange={(e) => setAdminRoomChangeData({ ...adminRoomChangeData, reason: e.target.value })}
              rows="3"
              placeholder="Enter reason for changing user's room..."
              required
              className="form-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Change Room</button>
          </div>
        </form>
      </div>
    </div>
  );
};
