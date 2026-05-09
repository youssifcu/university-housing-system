import React from 'react';
import '../../styles/AdminDashboard.css';

const ReportsTab = ({
  reports,
  reportsLoading,
  reportsPage,
  setReportsPage,
  reportsLimit,
  setReportsLimit,
  reportsTotalPages,
  reportsTotal,
  reportsFilters,
  setReportsFilters,
  availableReportTypes,
  availableReportSeverities,
  availableReportStatuses,
  loadReports,
  handleUpdateReportStatus,
}) => {
  const toText = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') return value?.name || value?.title || value?.label || JSON.stringify(value);
    return fallback;
  };

  const unwrapMongoId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.$oid || value._id || value.id || '';
    return '';
  };

  const unwrapMongoDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (typeof value === 'object' && value.$date) return new Date(value.$date);
    return new Date(value);
  };

  const formatDateTime = (value) => {
    const date = unwrapMongoDate(value);
    if (!date || Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  };

  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2>Reports</h2>
            <div className="admin-hint-text">
              Total: <strong>{reportsTotal || reports?.length || 0}</strong> · Page <strong>{reportsPage}</strong> of{' '}
              <strong>{reportsTotalPages || 1}</strong>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => loadReports()} disabled={reportsLoading}>
            Refresh
          </button>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div className="admin-reports-controls">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="admin-control-label">Type</label>
              <select
                className="role-dropdown"
                value={reportsFilters?.type || ''}
                onChange={async (e) => {
                  const next = { ...reportsFilters, type: e.target.value };
                  setReportsFilters(next);
                  setReportsPage(1);
                  await loadReports({ page: 1, filters: next });
                }}
              >
                <option value="">All</option>
                {availableReportTypes?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="admin-control-label">Severity</label>
              <select
                className="role-dropdown"
                value={reportsFilters?.severity || ''}
                onChange={async (e) => {
                  const next = { ...reportsFilters, severity: e.target.value };
                  setReportsFilters(next);
                  setReportsPage(1);
                  await loadReports({ page: 1, filters: next });
                }}
              >
                <option value="">All</option>
                {availableReportSeverities?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="admin-control-label">Status</label>
              <select
                className="role-dropdown"
                value={reportsFilters?.status || ''}
                onChange={async (e) => {
                  const next = { ...reportsFilters, status: e.target.value };
                  setReportsFilters(next);
                  setReportsPage(1);
                  await loadReports({ page: 1, filters: next });
                }}
              >
                <option value="">All</option>
                {availableReportStatuses?.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="admin-control-label">Rows</label>
              <select
                className="role-dropdown"
                value={reportsLimit}
                onChange={async (e) => {
                  const nextLimit = Number(e.target.value);
                  setReportsLimit(nextLimit);
                  setReportsPage(1);
                  await loadReports({ page: 1, limit: nextLimit });
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={reportsLoading || reportsPage <= 1}
                onClick={async () => {
                  const nextPage = Math.max(1, reportsPage - 1);
                  setReportsPage(nextPage);
                  await loadReports({ page: nextPage });
                }}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={reportsLoading || reportsPage >= (reportsTotalPages || 1)}
                onClick={async () => {
                  const nextPage = Math.min(reportsTotalPages || 1, reportsPage + 1);
                  setReportsPage(nextPage);
                  await loadReports({ page: nextPage });
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          {reportsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading reports...
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Student</th>
                  <th>Reported By</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {reports?.map((r, idx) => {
                  const id = unwrapMongoId(r?._id) || r?.id || String(idx);
                  const statusValue = r?.status || 'N/A';
                  const statusClass = `status-pill ${
                    statusValue && typeof statusValue === 'string'
                      ? `status-${statusValue.toLowerCase().replace(/\s+/g, '_')}`
                      : ''
                  }`;

                  return (
                    <tr key={id}>
                      <td>{toText(r?.type)}</td>
                      <td>{toText(r?.severity)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={statusClass}>{toText(statusValue)}</span>
                          <select
                            className="role-dropdown"
                            value={r?.status || ''}
                            onChange={(e) => handleUpdateReportStatus(id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <option value="open">open</option>
                            <option value="in_progress">in_progress</option>
                            <option value="closed">closed</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ maxWidth: 420 }}>
                        <div className="admin-ellipsis">{toText(r?.description, '')}</div>
                      </td>
                      <td className="text-muted">{unwrapMongoId(r?.studentId) || toText(r?.studentId)}</td>
                      <td className="text-muted">{unwrapMongoId(r?.reportedBy) || toText(r?.reportedBy)}</td>
                      <td className="text-muted">{unwrapMongoId(r?.assignedTo) || toText(r?.assignedTo)}</td>
                      <td>{formatDateTime(r?.createdAt)}</td>
                      <td>{formatDateTime(r?.updatedAt)}</td>
                    </tr>
                  );
                })}

                {(!reports || reports.length === 0) && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No reports found for the selected filters.
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
