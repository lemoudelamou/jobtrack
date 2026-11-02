export type Job = {
  id: number;
  company: string;
  position: string;
  location: string;
  status:
  | "Wishlist"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected";
  appliedDate: string;

  jobUrl?: string | null;
  salary?: string | null;
  notes?: string | null;
};

export type JobStatus = Job["status"];