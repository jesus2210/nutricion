// LAYER: Domain
// Entidad de Usuario y Roles del Sistema Nutricional

export type UserRole = 'admin' | 'patient';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export function isPatient(user: User): boolean {
  return user.role === 'patient';
}
