export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string | null;
  licenseNumber: string | null;
  clinicName: string | null;
  createdAt: Date;
}

export interface UpdateDoctorProfileInput {
  specialization?: string;
  licenseNumber?: string;
  clinicName?: string;
}
