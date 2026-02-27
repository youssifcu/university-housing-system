import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../lib/firebaseConfig';
import type { User } from '../types/userTypes';

const USERS_COLLECTION = 'users';

export const checkUserExists = async (email: string, studentId: string): Promise<boolean> => {
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


export const createUserInFirestore = async (userData: Omit<User, 'id'>): Promise<string> => {
  try {
    const userCollection = collection(db, USERS_COLLECTION);
    const docRef = await addDoc(userCollection, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};


export const registerUserWithAuth = async (email: string, password: string) => {
  try {
    // Check if auth is properly initialized
    if (!auth) {
      throw new Error('Firebase Auth is not properly initialized');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error registering user with Firebase Auth:', error);
    
    // More specific error handling
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


export const registerUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<{userId: string, authUser: any}> => {
  try {
    const exists = await checkUserExists(userData.universityEmail, userData.studentId);
    if (exists) {
      throw new Error('User with this email or student ID already exists');
    }

    const authUser = await registerUserWithAuth(userData.universityEmail, userData.password!);

    const userId = await createUserInFirestore({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, {
      id: authUser.uid,
      updatedAt: new Date()
    });

    return { userId, authUser };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};


export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('universityEmail', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getUserByStudentId = async (studentId: string): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('studentId', '==', studentId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by student ID:', error);
    throw error;
  }
};