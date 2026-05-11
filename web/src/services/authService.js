import { api, setAuthToken, removeAuthToken } from './api';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';

const AUTH_USER_STORAGE_KEY = 'authUser';

const setStoredAuthUser = (user) => {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

export const getStoredAuthUser = () => {
  const user = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  return user ? JSON.parse(user) : null;
};

const getFirebaseAuthHeader = async (firebaseUser) => {
  const idToken = await firebaseUser.getIdToken();
  console.log('Firebase ID token:', idToken);
  setAuthToken(idToken);

  return {
    Authorization: `Bearer ${idToken}`,
  };
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUid = userCredential.user.uid;
    const authHeaders = await getFirebaseAuthHeader(userCredential.user);

    const response = await api.post('/api/auth/login', { firebaseUid }, authHeaders);
    const loggedInUser = response?.data?.user || response?.user || null;

    if (loggedInUser) {
      setStoredAuthUser(loggedInUser);
    }

    return loggedInUser || response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  let firebaseUser = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    firebaseUser = userCredential.user;
    const firebaseUid = firebaseUser.uid;
    const authHeaders = await getFirebaseAuthHeader(firebaseUser);

    const registrationData = {
      firebaseUid,
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      studentId: userData.studentId,
      nationalId: userData.nationalId,
      universityYear: userData.universityYear,
      faculty: userData.faculty,
      email: userData.email,
      gender: userData.gender || 'male'
    };

    console.log('Sending registration data:', registrationData);
    const response = await api.post('/api/auth/register', registrationData, authHeaders);
    console.log('Registration response:', response);

    return response;
  } catch (error) {
    if (firebaseUser) {
      try {
        await deleteUser(firebaseUser);
        console.log('Rolled back Firebase user after backend registration failure.');
      } catch (rollbackError) {
        console.error('Failed to roll back Firebase user:', rollbackError);
      }
    }

    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

export const logoutUser = () => {
  removeAuthToken();
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const getCurrentUser = async () => {
  try {
    const authHeaders = auth.currentUser
      ? await getFirebaseAuthHeader(auth.currentUser)
      : undefined;

    const response = await api.get('/api/auth/profile', authHeaders);
    const currentUser = response?.data?.user || response?.user || response;

    if (currentUser) {
      setStoredAuthUser(currentUser);
    }

    return currentUser;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const updateCurrentUser = async (profileData) => {
  try {
    const authHeaders = auth.currentUser
      ? await getFirebaseAuthHeader(auth.currentUser)
      : undefined;

    const response = await api.put('/api/auth/profile', profileData, authHeaders);
    const updatedUser = response?.data?.user || response?.user || response;

    if (updatedUser) {
      setStoredAuthUser(updatedUser);
    }

    return updatedUser;
  } catch (error) {
    console.error('Update current user error:', error);
    throw error;
  }
};
