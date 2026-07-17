export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  profilePhoto: string | null;
  createdAt: Date;
}

export interface CreateFamilyMemberInput {
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}

export interface UpdateFamilyMemberInput {
  name?: string;
  relationship?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}
