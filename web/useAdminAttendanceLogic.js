import { useState } from 'react';
import { getAllBuildings } from '../../services/buildingService';
import { getAllRooms } from '../../services/roomService';
import { getAttendanceByBuilding } from '../../services/attendanceService';

export const useAdminAttendanceLogic = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
  });
  const [attendancePagination, setAttendancePagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceSelectedBuildingId, setAttendanceSelectedBuildingId] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const loadBuildingsAndRooms = async () => {
    try {
      const [buildingsData, roomsData] = await Promise.all([
        getAllBuildings(),
        getAllRooms(),
      ]);

      const normalizedBuildings = (Array.isArray(buildingsData) ? buildingsData : []).map((building) => ({
        ...building,
        id: building.id || building._id,
      }));

      const normalizedRooms = (Array.isArray(roomsData) ? roomsData : []).map((room) => ({
        ...room,
        id: room.id || room._id,
        buildingId: room.buildingId?._id || room.buildingId?.id || room.buildingId,
      }));

      setBuildings(normalizedBuildings);
      setRooms(normalizedRooms);
      return normalizedBuildings;
    } catch (error) {
      console.error('Error loading buildings and rooms:', error);
      setBuildings([]);
      setRooms([]);
      return [];
    }
  };

  const loadAttendanceByBuilding = async (buildingId = attendanceSelectedBuildingId) => {
    if (!buildingId) {
      setAttendanceSelectedBuildingId('');
      setAttendanceRecords([]);
      setAttendanceStats({
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
      });
      setAttendancePagination({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
      });
      setAttendanceDate('');
      return;
    }

    try {
      setAttendanceLoading(true);
      const attendancePayload = await getAttendanceByBuilding(buildingId);
      setAttendanceSelectedBuildingId(buildingId);
      setAttendanceRecords(Array.isArray(attendancePayload?.records) ? attendancePayload.records : []);
      setAttendanceStats(attendancePayload?.stats || {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
      });
      setAttendancePagination(attendancePayload?.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
      });
      setAttendanceDate(attendancePayload?.date || '');
    } catch (error) {
      alert('Error loading attendance: ' + error.message);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  return {
    buildings,
    rooms,
    attendanceRecords,
    attendanceStats,
    attendancePagination,
    attendanceDate,
    attendanceSelectedBuildingId,
    attendanceLoading,
    setAttendanceSelectedBuildingId,
    loadBuildingsAndRooms,
    loadAttendanceByBuilding,
  };
};
