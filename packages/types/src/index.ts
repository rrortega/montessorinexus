export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'TEACHER' | 'TUTOR';

export type Relationship = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

export type AccessType = 'public' | 'code_auth';

export interface School {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  mapLat?: number | null;
  mapLng?: number | null;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  phone?: string;
  email?: string;
  features?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface SchoolMembership {
  id: string;
  userId: string;
  schoolId: string;
  role: Role;
  school: School;
}

export interface AuthSession {
  user: UserProfile;
  memberships: SchoolMembership[];
  activeMembership: SchoolMembership;
  token: string;
}

export interface EnvironmentItem {
  id: string;
  schoolId: string;
  name: string;
  stage?: string;
  description?: string;
  coverImage?: string;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  capacity?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  schoolId: string;
  environmentId?: string | null;
  fullName: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  nationalId?: string;
  idDocumentUrl?: string;
  grade?: string;
  enrollmentCode?: string;
  enrollmentDate?: string;
  previousSchool?: string;
  previousMethodology?: string;
  bloodType?: string;
  allergies?: string;
  medicalNotes?: string;
  internalNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  environment?: EnvironmentItem;
  tutors?: StudentTutorRelation[];
}

export interface StudentTutorRelation {
  id: string;
  studentId: string;
  tutorUserId: string;
  relationship: Relationship;
  isPrimaryContact?: boolean;
  authorizedPickUp?: boolean;
  tutor?: UserProfile;
  student?: Student;
}

export interface Folder {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  accessType: AccessType;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  schoolId: string;
  folderId: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  accessType: AccessType;
  fileName: string;
  fileType: string;
  fileData: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationLink {
  id: string;
  appId: string;
  label: string;
  labelEn?: string;
  url: string;
  createdAt: string;
}

export interface ApplicationItem {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  iconUrl?: string;
  links: ApplicationLink[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryCategory {
  id: string;
  schoolId: string;
  label: string;
  labelEn?: string;
  createdAt: string;
}

export interface GalleryImageItem {
  id: string;
  schoolId: string;
  categoryId: string;
  src: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  createdAt: string;
}
