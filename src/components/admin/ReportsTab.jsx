import React from 'react';
import '../../styles/AdminDashboard.css';

const ReportsTab = ({
  buildings,
  attendanceRecords,
  attendanceSelectedBuildingId,
  setAttendanceSelectedBuildingId,
  attendanceLoading,
  loadAttendanceByBuilding,
}) => {
  const toText = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      return value.name || value.title || value.studentId || value._id || value.id || fallback;
    }
    return fallback;
  };

  const getStudentName = (record) =>
    toText(record.studentName, '') ||
    record.userName ||
    record.name ||
    record.student?.name ||
    record.user?.name ||
    toText(record.student, '') ||
    toText(record.user, 'N/A');

  const getStudentId = (record) =>
    toText(record.studentId, '') ||
    record.student?.studentId ||
    record.user?.studentId ||
    record.userId ||
    record.student?._id ||
    record.user?._id ||
    'N/A';

  const getAttendanceStatus = (record) =>
    toText(record.status, '') ||
    record.attendanceStatus ||
    record.state ||
    'N/A';

  const formatDateTime = (value) => {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return toText(value);
    }

    return date.toLocaleString();
  };

  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Attendance Management</h2>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Building</label>
              <select
                value={attendanceSelectedBuildingId}
                onChange={(e) => setAttendanceSelectedBuildingId(e.target.value)}
                className="form-input"
              >
                <option value="">Select Building</option>
                {buildings?.map((building) => (
                  <option key={building.id || building._id} value={building.id || building._id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={() => loadAttendanceByBuilding(attendanceSelectedBuildingId)}
              disabled={attendanceLoading || !attendanceSelectedBuildingId}
            >
              {attendanceLoading ? 'Loading...' : 'Show Attendance'}
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                setAttendanceSelectedBuildingId('');
                loadAttendanceByBuilding('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {attendanceLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance...
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Building</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords?.map((record, index) => {
                  const recordKey = record.id || record._id || `${getStudentId(record)}-${record.date || record.createdAt || index}`;

                  return (
                    <tr key={recordKey}>
                      <td>{getStudentName(record)}</td>
                      <td>{getStudentId(record)}</td>
                      <td>{toText(record.buildingName, '') || record.building?.name || toText(record.building)}</td>
                      <td>{formatDateTime(record.date || record.attendanceDate || record.createdAt)}</td>
                      <td>{formatDateTime(record.checkInTime || record.checkIn || record.entryTime)}</td>
                      <td>{formatDateTime(record.checkOutTime || record.checkOut || record.exitTime)}</td>
                      <td>{getAttendanceStatus(record)}</td>
                    </tr>
                  );
                })}

                {attendanceRecords?.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      {attendanceSelectedBuildingId ? 'No attendance found for this building.' : 'Select a building to view attendance.'}
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

export default ReportsTab;
