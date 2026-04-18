import React from 'react';
import '../../styles/AdminDashboard.css';

const ReportsTab = ({
  reports,
  reportPage,
  reportTotalPages,
  reportLimit,
  setReportLimit,
  reportFilters,
  setReportFilters,
  reportLoading,
  loadReports,
  handleViewReportDetails,
  handleUpdateReportStatus,
  handleDeleteReport,
}) => {
  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Reports Management</h2>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <select
                value={reportFilters.type}
                onChange={(e) => setReportFilters({ ...reportFilters, type: e.target.value })}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="complaint">Complaint</option>
                <option value="maintenance">Maintenance</option>
                <option value="incident">Incident</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select
                value={reportFilters.status}
                onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                className="form-input"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Severity</label>
              <select
                value={reportFilters.severity}
                onChange={(e) => setReportFilters({ ...reportFilters, severity: e.target.value })}
                className="form-input"
              >
                <option value="">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => loadReports({ page: 1 })}
              disabled={reportLoading}
            >
              {reportLoading ? 'Loading...' : 'Apply Filter'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                const emptyFilters = { type: '', status: '', severity: '' };
                setReportFilters(emptyFilters);
                loadReports({ page: 1, filters: emptyFilters });
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <label style={{ color: '#64748b' }}>Page</label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadReports({ page: Math.max(1, reportPage - 1) })}
            disabled={reportPage === 1 || reportLoading}
          >
            Previous
          </button>
          <span style={{ color: '#0f172a', minWidth: '3rem', textAlign: 'center', fontWeight: 600 }}>
            {reportPage} / {reportTotalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadReports({ page: Math.min(reportTotalPages, reportPage + 1) })}
            disabled={reportPage >= reportTotalPages || reportLoading}
          >
            Next
          </button>
          <label style={{ color: '#64748b', marginLeft: '0.5rem' }}>Rows</label>
          <select
            value={reportLimit}
            onChange={(e) => {
              const nextLimit = Number(e.target.value);
              setReportLimit(nextLimit);
              loadReports({ page: 1, limit: nextLimit });
            }}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="table-responsive">
          {reportLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading reports...
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports?.map((report) => {
                  const reportId = report.id || report._id || 'N/A';
                  return (
                    <tr key={reportId}>
                      <td className="fw-bold text-blue">{String(reportId).substring(0, 8).toUpperCase()}</td>
                      <td>{report.type || '—'}</td>
                      <td>{report.status || '—'}</td>
                      <td>{report.severity || '—'}</td>
                      <td>{report.title || report.subject || report.description || '—'}</td>
                      <td>
                        <div className="action-cell">

                          <button className="btn-icon edit" onClick={() => handleUpdateReportStatus(reportId)}>
                            Status
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteReport(reportId)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reports?.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No reports found.
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
