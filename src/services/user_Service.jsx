import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser, getAuth as getSecondaryAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, firebaseConfig } from '../../lib/firebaseConfig';
import { initializeApp, deleteApp } from 'firebase/app';
import { api } from './api';

const USERS_COLLECTION = 'users';


export const checkUserExists = async (email, studentId) => {
  try {
    const emailQuery = query(
      collection(db, USERS_COLLECTION),
      where('universityEmail', '==', email)
    );

    const studentIdQuery = query(
      collection(db, USERS_COLLECTION),
      where('studentId', '==', studentId)
    );

    const [emailSnapshot, studentIdSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(studentIdQuery)
    ]);

    return !!(emailSnapshot.docs.length > 0 || studentIdSnapshot.docs.length > 0);
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
};
export const createUserInFirestore = async (userData) => {
  try {
    const userEmail = userData.universityEmail;
    const userDocRef = doc(db, USERS_COLLECTION, userEmail);

    await setDoc(userDocRef, {
      ...userData,
      role: userData.role || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return userDocRef.id;
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};


export const registerUserWithAuth = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not properly initialized');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user with Firebase Auth:', error);

    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.code === 'auth/configuration-not-found') {
      throw new Error('Authentication configuration not found. Please contact support.');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Invalid API configuration. Please contact support.');
    } else {
      throw error;
    }
  }
};


export const registerUser = async (userData) => {
  try {
    const exists = await checkUserExists(userData.universityEmail, userData.studentId);
    if (exists) {
      throw new Error('User with this email or student ID already exists');
    }

    const authUser = await registerUserWithAuth(userData.universityEmail, userData.password);

    let profileImageUrl = '';

    const userDataWithId = {
      ...userData,
      id: authUser.uid,
      role: 'member',
      profileImageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    delete userDataWithId.password;
    delete userDataWithId.profileImage;
    const userId = await createUserInFirestore(userDataWithId);

    return { userId, authUser };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};


export const getUserByEmail = async (email) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, email);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const updateUserRole = async (email, role) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, email);
    await updateDoc(userDocRef, {
      role,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const updateUserProfile = async (email, userData) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, email);
    await updateDoc(userDocRef, {
      ...userData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const deleteUser = async (email) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, email);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
export const adminRegisterUser = async (userData) => {
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
  const secondaryAuth = getSecondaryAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email || userData.universityEmail, 
      userData.password
    );

    const userDataWithId = {
      ...userData,
      id: userCredential.user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    delete userDataWithId.password;

    const authHeaders = {
      Authorization: `Bearer ${await userCredential.user.getIdToken()}`,
    };

    const registrationData = {
      firebaseUid: userCredential.user.uid,
      name: userData.name || userData.fullName || '',
      phoneNumber: userData.phoneNumber || '',
      studentId: userData.studentId || '',
      nationalId: userData.nationalId || '',
      universityYear: Number(userData.universityYear),
      faculty: userData.faculty || userData.universityName || '',
      email: userData.email || userData.universityEmail || '',
      gender: userData.gender || 'male',
    };

    console.log('Admin add user payload -> /api/auth/register:', registrationData);

    // Main source of truth used by admin listing is backend /api users.
    await api.post('/api/auth/register', registrationData, authHeaders);

    // Keep Firestore profile for legacy reads in some screens.
    const userEmail = userData.email || userData.universityEmail;
    const userDocRef = doc(db, 'users', userEmail);
    await setDoc(userDocRef, userDataWithId);

    await deleteApp(secondaryApp);

    return userCredential.user.uid;
  } catch (error) {
    try {
      if (secondaryAuth.currentUser) {
        await deleteAuthUser(secondaryAuth.currentUser);
      }
    } catch (rollbackError) {
      console.error('Failed to roll back admin-created auth user:', rollbackError);
    }
    await deleteApp(secondaryApp);
    console.error('Error in admin register:', error);
    throw error;
  }
};

export const getAllBuildings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'buildings'));
    const buildings = [];
    querySnapshot.forEach((doc) => {
      buildings.push({ id: doc.id, ...doc.data() });
    });
    return buildings;
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw error;
  }
};

export const addBuilding = async (buildingData) => {
  try {
    const docRef = await addDoc(collection(db, 'buildings'), {
      ...buildingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding building:', error);
    throw error;
  }
};

export const updateBuilding = async (buildingId, buildingData) => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    await updateDoc(buildingRef, {
      ...buildingData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating building:', error);
    throw error;
  }
};

export const deleteBuilding = async (buildingId) => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    await deleteDoc(buildingRef);
  } catch (error) {
    console.error('Error deleting building:', error);
    throw error;
  }
};

export const getAllRooms = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'rooms'));
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return rooms;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const addRoom = async (roomData) => {
  try {
    const docRef = await addDoc(collection(db, 'rooms'), {
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding room:', error);
    throw error;
  }
};

export const updateRoom = async (roomId, roomData) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      ...roomData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

export const assignStudentToRoom = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    if (roomData.currentOccupancy >= roomData.capacity) {
      throw new Error('Room is full');
    }

    const newOccupancy = roomData.currentOccupancy + 1;
    await updateDoc(roomRef, {
      currentOccupancy: newOccupancy,
      status: newOccupancy >= roomData.capacity ? 'full' : roomData.status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error assigning student to room:', error);
    throw error;
  }
};

export const removeStudentFromRoom = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    if (roomData.currentOccupancy <= 0) {
      return;
    }

    const newOccupancy = roomData.currentOccupancy - 1;
    await updateDoc(roomRef, {
      currentOccupancy: newOccupancy,
      status: roomData.status === 'full' ? 'available' : roomData.status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error removing student from room:', error);
    throw error;
  }
};

export const submitApplication = async (applicationData) => {
  try {
    const docRef = await addDoc(collection(db, 'applications'), {
      ...applicationData,
      status: 'Pending',
      submittedAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};

export const getApplicationsByUser = async (userEmail) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('userEmail', '==', userEmail)
    );
    const querySnapshot = await getDocs(q);
    const applications = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    return applications;
  } catch (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }
};

export const getAllApplications = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'applications'));
    const applications = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    return applications;
  } catch (error) {
    console.error('Error fetching all applications:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, {
      status: status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

export const updateApplication = async (applicationId, applicationData) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, {
      ...applicationData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    await deleteDoc(appRef);
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};

export const submitRoomChangeRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'roomChangeRequests'), {
      ...requestData,
      status: 'Pending',
      requestedAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting room change request:', error);
    throw error;
  }
};

export const getRoomChangeRequestsByUser = async (userEmail) => {
  try {
    const q = query(
      collection(db, 'roomChangeRequests'),
      where('userEmail', '==', userEmail)
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error('Error fetching room change requests:', error);
    throw error;
  }
};

export const getAllRoomChangeRequests = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'roomChangeRequests'));
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error('Error fetching all room change requests:', error);
    throw error;
  }
};

export const updateRoomChangeRequestStatus = async (requestId, status) => {
  try {
    const requestRef = doc(db, 'roomChangeRequests', requestId);
    await updateDoc(requestRef, {
      status: status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating room change request status:', error);
    throw error;
  }
};

export const getRoomById = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching room:', error);
    throw error;
  }
};

export const getBuildingById = async (buildingId) => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingSnap = await getDoc(buildingRef);
    if (buildingSnap.exists()) {
      return { id: buildingSnap.id, ...buildingSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching building:', error);
    throw error;
  }
};

export const assignUserToNewRoom = async (userEmail, oldRoomId, newRoomId, newRoomDetails) => {
  try {
    if (oldRoomId && oldRoomId !== newRoomId) {
      await removeStudentFromRoom(oldRoomId);
    }

    await assignStudentToRoom(newRoomId);

    const userRef = doc(db, 'users', userEmail);
    await updateDoc(userRef, {
      currentRoomId: newRoomId,
      currentBuildingId: newRoomDetails?.buildingId || null,
      currentBuildingName: newRoomDetails?.buildingName || null,
      currentRoomNumber: newRoomDetails?.roomNumber || null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error assigning user to new room:', error);
    throw error;
  }
};

export const adminChangeUserRoom = async (userEmail, oldRoomId, newRoomId, newRoomDetails, reason) => {
  try {
    if (oldRoomId && oldRoomId !== newRoomId) {
      await removeStudentFromRoom(oldRoomId);
    }

    await assignStudentToRoom(newRoomId);

    const userRef = doc(db, 'users', userEmail);
    await updateDoc(userRef, {
      currentRoomId: newRoomId,
      currentBuildingId: newRoomDetails?.buildingId || null,
      currentBuildingName: newRoomDetails?.buildingName || null,
      currentRoomNumber: newRoomDetails?.roomNumber || null,
      roomChangeReason: reason,
      roomChangedAt: new Date(),
      updatedAt: new Date()
    });

    const docRef = await addDoc(collection(db, 'adminRoomChanges'), {
      userEmail: userEmail,
      oldRoomId: oldRoomId,
      newRoomId: newRoomId,
      newBuildingName: newRoomDetails?.buildingName || null,
      newRoomNumber: newRoomDetails?.roomNumber || null,
      reason: reason,
      changedBy: 'admin',
      changedAt: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error in admin room change:', error);
    throw error;
  }
};