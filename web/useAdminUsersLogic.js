import { useMemo, useState } from 'react';
import { getAllUsers, updateUser, deleteUser, updateUserRole } from '../../services/userService';
import { adminRegisterUser } from '../../services/user_Service';

const initialNewUser = {
  name: '',
  email: '',
  phoneNumber: '',
  studentId: '',
  nationalId: '',
  universityYear: '',
  faculty: '',
  gender: 'male',
  password: '',
  role: 'student',
};

export const useAdminUsersLogic = () => {
  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(initialNewUser);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [addedUserSummary, setAddedUserSummary] = useState(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);

  const availableRoles = useMemo(
    () => Array.from(new Set(['student', 'admin', 'supervisor', ...users.map((u) => u.role).filter(Boolean)])),
    [users]
  );

  const loadUsers = async (overrides = {}) => {
    try {
      const allUsers = await getAllUsers({
        page: overrides.page ?? userPage,
        limit: overrides.limit ?? userLimit,
        role: overrides.role ?? (userRoleFilter || undefined),
      });
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setEditData({
      name: u.name || u.fullName,
      email: u.email || u.universityEmail,
      phoneNumber: u.phoneNumber || '',
      studentId: u.studentId,
      nationalId: u.nationalId || '',
      faculty: u.faculty || '',
      universityYear: u.universityYear || '',
      role: u.role,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(selectedUser.id || selectedUser._id, {
        name: editData.name,
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        studentId: editData.studentId,
        nationalId: editData.nationalId,
        faculty: editData.faculty,
        universityYear: Number(editData.universityYear),
        role: editData.role,
      });
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const currentUser = users.find((u) => (u.id || u._id) === userId);
    if (!currentUser) {
      alert('Error updating role: User not found');
      return;
    }

    const previousRole = currentUser.role;
    setUpdatingRoleUserId(userId);
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        (user.id || user._id) === userId ? { ...user, role: newRole } : user
      )
    );

    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          (user.id || user._id) === userId ? { ...user, role: previousRole } : user
        )
      );
      alert('Error updating role: ' + error.message);
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        await loadUsers();
        alert('Deleted successfully');
      } catch (error) {
        alert('Deletion error: ' + error.message);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminRegisterUser(newUser);
      setShowAddModal(false);
      setAddedUserSummary({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
      setShowAddSuccess(true);
      setNewUser(initialNewUser);
      await loadUsers();
    } catch (error) {
      alert('Error in addition: ' + error.message);
    }
  };

  return {
    users,
    availableRoles,
    userRoleFilter,
    setUserRoleFilter,
    userPage,
    setUserPage,
    userLimit,
    setUserLimit,
    loadUsers,
    handleEditUser,
    handleRoleChange,
    handleDeleteUser,
    handleAddUser,
    showAddSuccess,
    setShowAddSuccess,
    addedUserSummary,
    updatingRoleUserId,
    showEditModal,
    setShowEditModal,
    selectedUser,
    editData,
    setEditData,
    handleSaveEdit,
    showAddModal,
    setShowAddModal,
    newUser,
    setNewUser,
  };
};
