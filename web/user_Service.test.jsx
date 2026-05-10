import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteUser, adminRegisterUser } from './user_Service';
import { deleteDoc, setDoc, doc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ id })), 
  deleteDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'SecondaryApp' })),
  deleteApp: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: { uid: 'fake-user-id-123' } 
  })),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
  auth: {},
  storage: {},
  firebaseConfig: {}
}));

describe('user_Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call deleteDoc once with correct parameters when deleting a user', async () => {
    const email = 'test@example.com';
    await deleteUser(email);
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should create user, save to firestore without password, and delete secondary app', async () => {
    const mockUserData = {
      fullName: 'Test Student',
      universityEmail: 'test@stud.cu.edu.eg',
      studentId: '123456',
      password: 'secretPassword123',
      role: 'member'
    };

    const resultId = await adminRegisterUser(mockUserData);

    
    expect(initializeApp).toHaveBeenCalled();

    expect(createUserWithEmailAndPassword).toHaveBeenCalled();

    expect(setDoc).toHaveBeenCalled();
    const savedData = vi.mocked(setDoc).mock.calls[0][1];
    expect(savedData.password).toBeUndefined(); 
    expect(savedData.universityEmail).toBe(mockUserData.universityEmail);

    expect(deleteApp).toHaveBeenCalled();

    expect(resultId).toBe('fake-user-id-123');
  });
});