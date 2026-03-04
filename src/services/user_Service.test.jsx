import { describe, it, expect, vi } from 'vitest';
import { deleteUser } from './user_Service';
import { deleteDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  deleteDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
  auth: {},
  storage: {}
}));

describe('Testing deleteUser Function', () => {
  it('should call deleteDoc once with correct parameters', async () => {
    const email = 'test@example.com';
    
    await deleteUser(email);
    expect(deleteDoc).toHaveBeenCalled();
  });
});