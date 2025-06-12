type Vote = {
  position: string;
  confidence: number; // 0-100
};

type Advisor = {
  name: string;
  description: string;
  active: boolean;
  groups?: string[];
  color?: string;
  vote?: (question: string) => Promise<Vote> | Vote;
};

type AdvisorGroup = {
  name: string;
  description?: string;
  advisors: string[]; // Array of advisor names
  active: boolean;
};

export type { Advisor, AdvisorGroup, Vote };
