import React, { useState, useEffect } from 'react';
import { getAllBuildings } from '../services/buildingService';
import { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, assignStudentToRoom } from '../services/roomService';
import { clearAssignedRoomByStudentId, getAllUsers } from '../services/userService';
import '../styles/ManageRooms.css';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [roomForm, setRoomForm] = useState({
    id: '',
    buildingId: '',
    floorNumber: 1,
    roomNumber: '',
    capacity: 2,
    status: 'available',
    amenities: [{ name: '', isWorking: true }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, buildingsData] = await Promise.all([
        getAllRooms(),
        getAllBuildings()
      ]);

      // Enrich rooms with building names
      const enrichedRooms = roomsData.map(room => {
        const building = buildingsData.find(b => (b.id || b._id) === room.buildingId);
        return {
          ...room,
          id: room.id || room._id,
          buildingName: building ? building.name : 'Unknown'
        };
      });

      setRooms(enrichedRooms);
      setBuildings(buildingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (index, field, value) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((amenity, amenityIndex) =>
        amenityIndex === index ? { ...amenity, [field]: value } : amenity
      ),
    }));
  };

  const handleAddAmenity = () => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, { name: '', isWorking: true }],
    }));
  };

  const handleRemoveAmenity = (index) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, amenityIndex) => amenityIndex !== index),
    }));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setRoomForm({
      id: '',
      buildingId: buildings[0]?.id || buildings[0]?._id || '',
      floorNumber: 1,
      roomNumber: '',
      capacity: 2,
      status: 'available',
      amenities: [{ name: '', isWorking: true }]
    });
    setShowRoomModal(true);
  };

  const handleOpenEdit = async (room) => {
    try {
      const roomId = room.id || room._id;
      const fullRoom = await getRoomById(roomId);

      setIsEditing(true);
      setRoomForm({
        id: fullRoom?._id || roomId || '',
        buildingId: fullRoom?.buildingId?._id || fullRoom?.buildingId || room.buildingId || '',
        floorNumber: fullRoom?.floorNumber || 1,
        roomNumber: fullRoom?.roomNumber || '',
        capacity: fullRoom?.capacity || 2,
        amenities: fullRoom?.amenities?.length ? fullRoom.amenities : [{ name: '', isWorking: true }],
        status: fullRoom?.status || 'available'
      });
      setShowRoomModal(true);
    } catch (error) {
      console.error('Error loading room details:', error);
      alert('Error loading room details: ' + error.message);
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        buildingId: roomForm.buildingId,
        roomNumber: roomForm.roomNumber,
        floorNumber: parseInt(roomForm.floorNumber),
        capacity: parseInt(roomForm.capacity),
        status: roomForm.status,
        amenities: roomForm.amenities.filter((amenity) => amenity.name.trim())
      };

      if (isEditing) {
        await updateRoom(roomForm.id, roomData);
        alert('Room updated successfully!');
      } else {
        await createRoom(roomData);
        alert('Room added successfully!');
      }
      setShowRoomModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room: ' + error.message);
    }
  };

  const handleAssignStudent = async (roomId, roomNumber) => {
    try {
      const studentIdInput = window.prompt(
        `Enter the Student ID to assign to Room ${roomNumber || 'selected room'}:`
      );

      if (studentIdInput === null) {
        return;
      }

      const studentId = studentIdInput.trim();
      if (!studentId) {
        alert('Student ID is required to assign a student to a room.');
        return;
      }

      await assignStudentToRoom(roomId, studentId);
      await loadData();
      alert('Student assigned successfully!');
    } catch (error) {
      console.error('Error assigning student:', error);
      alert(error.message);
    }
  };

  const handleRemoveStudent = async (roomId, roomNumber) => {
    try {
      const fullRoom = await getRoomById(roomId);
      const roomDetails = {
        ...fullRoom,
        id: fullRoom?.id || fullRoom?._id || roomId,
      };
      const allStudents = await getAllUsers({ limit: 500, role: 'student' });
      const studentsInRoom = getStudentsAssignedToRoom(roomDetails, allStudents);

      if (studentsInRoom.length === 0) {
        alert(`No students are currently assigned to Room ${roomNumber || 'selected room'}.`);
        return;
      }

      const studentChoiceInput = window.prompt(
        `Students in Room ${roomNumber || 'selected room'}:\n\n${studentsInRoom
          .map((student, index) => formatStudentLabel(student, index))
          .join('\n')}\n\nEnter the number of the student you want to remove:`
      );

      if (studentChoiceInput === null) {
        return;
      }

      const selectedIndex = Number.parseInt(studentChoiceInput.trim(), 10) - 1;
      const selectedStudent = studentsInRoom[selectedIndex];

      if (!selectedStudent) {
        alert('Please enter a valid student number from the list.');
        return;
      }

      const selectedStudentLabel =
        selectedStudent.name ||
        selectedStudent.fullName ||
        selectedStudent.studentId ||
        selectedStudent.id ||
        selectedStudent._id;

      if (!window.confirm(`Are you sure you want to remove ${selectedStudentLabel} from Room ${roomNumber || 'selected room'}?`)) {
        return;
      }
      console.log(selectedStudent._id);

      await clearAssignedRoomByStudentId(
        roomId,
        selectedStudent._id,
        selectedStudent
      );


      await loadData();
      alert('Student removed successfully!');
    } catch (error) {
      console.error('Error removing student:', error);
      alert(error.message);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
      return;
    }

    try {
      await deleteRoom(roomId);
      await loadData();
      alert('Room deleted successfully!');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error deleting room: ' + error.message);
    }
  };

  const getOccupancyPercentage = (current, capacity) => {
    if (!capacity) return 0;
    return Math.min((current / capacity) * 100, 100);
  };

  const normalizeId = (value) => String(value || '').trim();

  const formatStudentLabel = (student, index) => {
    const studentName = student.name || student.fullName || 'Unknown Student';
    const studentIdentifier = student.studentId || student.id || student._id || 'No ID';
    return `${index + 1}. ${studentName} (${studentIdentifier})`;
  };

  const getStudentsAssignedToRoom = (roomDetails, allUsers = []) => {
    const roomId = normalizeId(roomDetails?.id || roomDetails?._id);
    const occupants = Array.isArray(roomDetails?.currentOccupants) ? roomDetails.currentOccupants : [];
    const usersByKey = new Map();

    allUsers.forEach((user) => {
      [user.id, user._id, user.studentId]
        .map(normalizeId)
        .filter(Boolean)
        .forEach((key) => usersByKey.set(key, user));
    });

    const studentsFromOccupants = occupants
      .map((occupant) => {
        if (occupant && typeof occupant === 'object') {
          const occupantKey = normalizeId(occupant.id || occupant._id || occupant.studentId);
          return usersByKey.get(occupantKey) || occupant;
        }

        return usersByKey.get(normalizeId(occupant));
      })
      .filter(Boolean);

    const studentsFromAssignedRoom = allUsers.filter((user) => {
      const assignedRoomId = normalizeId(
        user.assignedRoomId?._id || user.assignedRoomId?.id || user.assignedRoomId
      );

      return assignedRoomId && assignedRoomId === roomId;
    });

    const uniqueStudents = [];
    const seen = new Set();

    [...studentsFromOccupants, ...studentsFromAssignedRoom].forEach((student) => {
      const studentKey = normalizeId(student.id || student._id || student.studentId);

      if (!studentKey || seen.has(studentKey)) {
        return;
      }

      seen.add(studentKey);
      uniqueStudents.push(student);
    });

    return uniqueStudents;
  };

  if (loading) {
    return <div className="admin-section"><div className="loading-state">Loading rooms...</div></div>;
  }

  return (
    <div className="admin-section">
      <div className="admin-table-panel">
        <div className="panel-header">
          <h2>Rooms Management</h2>
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Add New Room
          </button>
        </div>

        <div className="rooms-grid">
          {rooms.map(room => {
            const roomId = room.id || room._id;
            const currentOccupancy = Array.isArray(room.currentOccupants)
              ? room.currentOccupants.length
              : Number(room.currentOccupancy || 0);
            const roomCapacity = Number(room.capacity || 0);

            return (
              <div key={roomId} className={`room-card status-${room.status}`}>
                <div className="room-header">
                  <div>
                    <h3>Room {room.roomNumber}</h3>
                    <span className="room-building-label">{room.buildingName} - Floor {room.floorNumber}</span>
                  </div>
                  <span className={`room-status-badge ${room.status}`}>{room.status}</span>
                </div>

                <div className="room-body">
                  <div className="room-meta-row">
                    <span>Capacity</span>
                    <strong>{roomCapacity} Beds</strong>
                  </div>
                  <div className="occupancy-info">
                    <span>Occupancy</span>
                    <span className="occupancy-numbers">{currentOccupancy} / {roomCapacity}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${currentOccupancy >= roomCapacity ? 'full' : ''}`}
                      style={{ width: `${getOccupancyPercentage(currentOccupancy, roomCapacity)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="room-actions-grid">
                  <button
                    className="btn-icon add-student"
                    onClick={() => handleAssignStudent(roomId, room.roomNumber)}
                    disabled={currentOccupancy >= roomCapacity || room.status === 'maintenance'}
                  >
                    + Assign
                  </button>
                  <button
                    className="btn-icon remove-student"
                    onClick={() => handleRemoveStudent(roomId, room.roomNumber)}
                    disabled={currentOccupancy <= 0}
                  >
                    - Remove
                  </button>
                  <button className="btn-icon edit" onClick={() => handleOpenEdit(room)}>
                    Edit Details
                  </button>
                  <button className="btn-icon delete-room" onClick={() => handleDeleteRoom(roomId, room.roomNumber)}>
                    Delete Room
                  </button>
                </div>
              </div>
            )
          })}
          {rooms.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}>No rooms found.</div>}
        </div>
      </div>

      {showRoomModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Room Details' : 'Add New Room'}</h3>
              <button className="close-btn" onClick={() => setShowRoomModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRoom} className="modal-form">
              <div className="form-group">
                <label>Building</label>
                <select name="buildingId" value={roomForm.buildingId} onChange={handleFormChange} required className="form-input">
                  <option value="" disabled>Select Building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Room Number</label>
                  <input type="text" name="roomNumber" value={roomForm.roomNumber} onChange={handleFormChange} required className="form-input" placeholder="e.g. 101A" />
                </div>
                <div className="form-group">
                  <label>Floor Number</label>
                  <input type="number" name="floorNumber" value={roomForm.floorNumber} onChange={handleFormChange} required className="form-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Capacity (Beds)</label>
                  <input type="number" name="capacity" value={roomForm.capacity} onChange={handleFormChange} required min="1" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={roomForm.status} onChange={handleFormChange} className="form-input">
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Amenities</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {roomForm.amenities.map((amenity, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={amenity.name}
                        onChange={(e) => handleAmenityChange(index, 'name', e.target.value)}
                        className="form-input"
                        placeholder="Amenity name"
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={amenity.isWorking}
                          onChange={(e) => handleAmenityChange(index, 'isWorking', e.target.checked)}
                        />
                        Working
                      </label>
                      {roomForm.amenities.length > 1 && (
                        <button type="button" className="btn-icon delete" onClick={() => handleRemoveAmenity(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" onClick={handleAddAmenity}>
                    + Add Amenity
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRooms;
