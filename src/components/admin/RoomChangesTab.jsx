import React from 'react';
import '../../styles/AdminDashboard.css';

const RoomChangesTab = ({
  roomChangeRequests,
  handleReviewRoomChangeRequest,
  handleApproveRoomChange,
  handleRejectRoomChange
}) => {
  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Room Change Requests</h2>
        </div>
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Student</th>
                <th>Current Room</th>
                <th>Requested Room</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roomChangeRequests?.map((request) => (
                <tr key={request.id}>
                  <td className="fw-bold text-blue">{request.id.substring(0, 8).toUpperCase()}</td>
                  <td>
                    <div className="student-info-col">
                      <span className="fw-bold">{request.studentName}</span>
                    </div>
                  </td>
                  <td>{request.currentRoomId ? 'Assigned' : 'Not Assigned'}</td>
                  <td>{request.requestedBuildingName} - {request.requestedRoomNumber}</td>
                  <td>
                    <span className="text-muted text-small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {request.reason}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-icon review" onClick={() => handleReviewRoomChangeRequest(request)}>👁️ Review</button>
                      {request.status === 'Pending' && (
                        <>
                          <button className="btn-icon approve" onClick={() => handleApproveRoomChange(request)}>✓</button>
                          <button className="btn-icon reject" onClick={() => handleRejectRoomChange(request.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {roomChangeRequests?.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No room change requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomChangesTab;
