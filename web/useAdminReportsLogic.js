import { useMemo, useState } from 'react';
import { getReportsWithFilters, updateReportStatus } from '../../services/reportService';

export const useAdminReportsLogic = () => {
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLimit, setReportsLimit] = useState(20);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsFilters, setReportsFilters] = useState({
    type: '',
    status: '',
    severity: '',
  });

  const availableReportTypes = useMemo(
    () => Array.from(new Set(reports.map((r) => r?.type).filter(Boolean))).sort(),
    [reports]
  );
  const availableReportSeverities = useMemo(
    () => Array.from(new Set(reports.map((r) => r?.severity).filter(Boolean))).sort(),
    [reports]
  );
  const availableReportStatuses = useMemo(
    () => Array.from(new Set(reports.map((r) => r?.status).filter(Boolean))).sort(),
    [reports]
  );

  const loadReports = async (overrides = {}) => {
    const nextPage = overrides.page ?? reportsPage;
    const nextLimit = overrides.limit ?? reportsLimit;
    const nextFilters = overrides.filters ?? reportsFilters;

    try {
      setReportsLoading(true);
      const payload = await getReportsWithFilters(nextPage, nextLimit, nextFilters);
      setReports(Array.isArray(payload?.reports) ? payload.reports : []);
      setReportsPage(payload?.page || nextPage);
      setReportsLimit(nextLimit);
      setReportsTotalPages(payload?.totalPages || 1);
      setReportsTotal(payload?.total || 0);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
      setReportsTotal(0);
      setReportsTotalPages(1);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, nextStatus) => {
    if (!reportId) return;

    const previous = reports;
    setReports((current) =>
      current.map((r) => {
        const id = r?._id?.$oid || r?._id || r?.id;
        return id === reportId ? { ...r, status: nextStatus } : r;
      })
    );

    try {
      await updateReportStatus(reportId, nextStatus);
      await loadReports();
    } catch (error) {
      alert('Error updating report status: ' + error.message);
      setReports(previous);
    }
  };

  return {
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
  };
};

