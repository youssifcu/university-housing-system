import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import { getCurrentUser } from '../services/authService';
import { useAdminUsersLogic } from './admin/useAdminUsersLogic';
import { useAdminApplicationsLogic } from './admin/useAdminApplicationsLogic';
import { useAdminRoomChangesLogic } from './admin/useAdminRoomChangesLogic';
import { useAdminMealsLogic } from './admin/useAdminMealsLogic';
import { useAdminAttendanceLogic } from './admin/useAdminAttendanceLogic';

export const useAdminDashboardLogic = (navigate) => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const usersLogic = useAdminUsersLogic();
  const applicationsLogic = useAdminApplicationsLogic();
  const mealsLogic = useAdminMealsLogic();
  const attendanceLogic = useAdminAttendanceLogic();
  const roomChangesLogic = useAdminRoomChangesLogic({
    buildings: attendanceLogic.buildings,
    rooms: attendanceLogic.rooms,
    loadUsers: usersLogic.loadUsers,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
        setLoading(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        localStorage.setItem('authToken', idToken);
      } catch (tokenError) {
        console.error('Error refreshing token:', tokenError);
      }

      try {
        const userData = await getCurrentUser();
        setUserName(userData?.name || userData?.fullName || 'User');
        if (userData?.role !== 'admin') {
          alert('Access denied. Admin only.');
          navigate('/member/dashboard');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
        if (storedUser.role !== 'admin') {
          alert('Access denied. Admin only.');
          navigate('/member/dashboard');
          setLoading(false);
          return;
        }
        setUserName(currentUser.displayName || currentUser.email || 'User');
      }

      await usersLogic.loadUsers();
      await applicationsLogic.loadApplications();
      await roomChangesLogic.loadRoomChangeRequests();
      await mealsLogic.loadMeals();
      const loadedBuildings = await attendanceLogic.loadBuildingsAndRooms();
      const firstBuildingId = loadedBuildings[0]?.id || loadedBuildings[0]?._id || '';
      if (firstBuildingId) {
        await attendanceLogic.loadAttendanceByBuilding(firstBuildingId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  return {
    loading,
    userName,
    ...usersLogic,
    ...applicationsLogic,
    ...roomChangesLogic,
    ...attendanceLogic,
    ...mealsLogic,
    handleLogout,
  };
};
