// app/types/election.ts
export interface Candidate {
  id: number;
  userId: number;
  party: string;
  bio: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | "BANNED";
  firstName?: string;
  lastName?: string;
}

export interface Elector {
  id: number;
  firstName: string;
  lastName: string;
  party: string;
  bio: string;
  imagePath: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | "BANNED";
}

export type ElectionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OPEN"
  | "CLOSED"
  | "ARCHIVED";

export interface Election {
  id: number;
  title: string;
  description: string;
  status: ElectionStatus;
  startAt: string;
  endAt: string;
  candidateIds: number[];
  candidates?: Candidate[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ElectionFormData {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
}

export interface VoteRequest {
  electionId: number;
  candidateId: number;
}

export interface VoteStats {
  activeElections: number;
  votesCast: number;
  pendingElections: number;
  timeRemaining: string;
}

export interface UserVote {
  electionId: number;
  candidateId: number;
  votedAt: string;
}

export interface Voter {
  id: number;
  userId: number;
  cin: string;
  cinImagePath: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionResult {
  id: number;
  electionId: number;
  candidateId: number;
  voteCount: number;
  calculatedAt: string;
}

export interface ChartData {
  id: number;
  label: string;
  value: number;
  party: string;
  color: string;
}
