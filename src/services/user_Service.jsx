import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../lib/firebaseConfig';

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
    // Temporarily disabled image upload due to CORS - uncomment when CORS is configured
    /*
    if (userData.profileImage) {
      const imageRef = ref(storage, `profiles/${authUser.uid}/${userData.profileImage.name}`);
      await uploadBytes(imageRef, userData.profileImage);
      profileImageUrl = await getDownloadURL(imageRef);
    }
    */

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
/*delete user */
export const deleteUser = async (email) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, email);  
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};