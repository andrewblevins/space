type Advisor = {
  name: string;
  description: string;
  active: boolean;
  groups?: string[];
};

type AdvisorGroup = {
  name: string;
  description?: string;
  advisors: string[];  // Array of advisor names
  active: boolean;
}; 