export interface DoctorPatientConnection {
  id: string;
  doctorId: string;
  patientId: string;
  status: "pending" | "accepted" | "rejected";
  respondedAt: Date | null;
  createdAt: Date;
}

// Connection as seen by a doctor — carries the patient's public info.
export interface DoctorSideConnection extends DoctorPatientConnection {
  patientName: string;
  patientPhone: string;
}

// Connection as seen by a patient — carries the doctor's public info.
export interface PatientSideConnection extends DoctorPatientConnection {
  doctorName: string;
  doctorPhone: string;
  doctorSpecialization: string | null;
}

export interface CreateConnectionInput {
  patientPhone: string;
}

export interface RespondConnectionInput {
  status: "accepted" | "rejected";
}
