export interface User {
  id?: string;
  fullName: string;
  studentId: string;
  universityEmail: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegistrationFormData {
  fullName: string;
  studentId: string;
  universityEmail: string;
  password: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    fullName?: string;
    studentId?: string;
    universityEmail?: string;
    password?: string;
  };
}