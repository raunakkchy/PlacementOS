export interface SkillWithLevel {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

export interface StudentProject {
  id?: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export interface StudentExperience {
  hasExperience: boolean;
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

export interface CareerPreferences {
  careerGoal: string;
  preferredField: string;
  preferredJobType: "Internship" | "Full-time" | "Both";
}

export interface AiRecommendedJobRole {
  role: string;
  whyMatch: string;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  eligibility: string;
  matchIndicator: number; // e.g. 78 for 78% profile match
}

export interface StudentAiRecommendations {
  studentId: string;
  generatedAt: string;
  isAiGenerated: boolean;
  recommendedRoles: AiRecommendedJobRole[];
}

export interface AiProfileAnalysis {
  currentStrengths: string[];
  skillGaps: string[];
  missingSkillsForTargetRoles: string[];
  recommendedJobRoles: {
    title: string;
    description: string;
    fitReason: string;
    expectedCtc?: string;
  }[];
  recommendedLearningTopics: {
    topic: string;
    why: string;
    priority: "Essential" | "High" | "Medium";
  }[];
  projectRecommendations: {
    title: string;
    description: string;
    techStack: string[];
    portfolioImpact: string;
  }[];
  resumeImprovements: {
    status: "available" | "not_uploaded";
    score?: number;
    suggestions: string[];
    atsTips?: string[];
  };
  interviewPrepAreas: {
    area: string;
    focus: string;
    sampleQuestion?: string;
  }[];
  analyzedAt: string;
}

export interface College {
  id: string;
  name: string;
  code?: string;
  domain?: string;
  website?: string;
  city: string;
  state: string;
  country?: string;
  officerName: string;
  officerEmail: string;
  officerPhone?: string;
  officerDesignation?: string;
  officerUserId: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  verificationMethod?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GranularConsent {
  shareAcademic: boolean;
  shareSkillRoadmap: boolean;
  shareInterviewScores: boolean;
  consentGivenAt: string;
  consentVersion: string;
}

export interface CollegeInvitation {
  id: string;
  collegeId: string;
  createdBy: string;
  code: string;
  label?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CollegeMembership {
  id: string;
  studentId: string;
  collegeId: string;
  invitationId?: string;
  invitationCode?: string;
  status: "pending" | "active" | "rejected" | "revoked" | "removed";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  consent: GranularConsent;
  college?: College;
  createdAt: string;
  updatedAt: string;
}

export interface CollegeStudentRosterItem {
  membershipId: string;
  status: "pending" | "active" | "rejected" | "revoked" | "removed";
  requestedAt: string;
  reviewedAt?: string;
  consent: GranularConsent;
  studentId: string;
  fullName: string;
  email: string;
  profilePhoto?: string;
  rollNumber?: string;
  course?: string;
  branch?: string;
  semester?: number;
  cgpa?: number;
  backlogs?: number;
  graduationYear?: number;
  skills?: string[];
  selectedRole?: string;
  roadmapOverallProgress?: number;
  completedTasks?: number;
  totalTasks?: number;
  skillGaps?: string[];
  readinessScore?: number | null;
  jobReadinessPercentage?: number | null;
  interviewReadinessScore?: number | null;
  technicalSkillsScore?: number | null;
  communicationScore?: number | null;
  lastInterviewScore?: number | null;
  lastInterviewDate?: string | null;
}

export interface SkillGapSummary {
  skill: string;
  missingCount: number;
  percentageOfCohort: number;
  category?: string;
}

export interface ReadinessBandSummary {
  bandName: string;
  minScore: number;
  maxScore: number;
  studentCount: number;
  percentage: number;
}

export interface CollegeDashboardAnalytics {
  collegeId: string;
  collegeName: string;
  totalLinkedStudents: number;
  activeLinkedStudents: number;
  studentsWithConsent: number;
  studentsWithReadinessData: number;
  averageReadinessScore: number | null;
  averageRoadmapProgress: number | null;
  topMissingSkills: SkillGapSummary[];
  readinessBands: ReadinessBandSummary[];
  minimumGroupSizeThreshold: number;
  anonymized: boolean;
  generatedAt: string;
}

export interface CollegeRegisterData {
  collegeName: string;
  code?: string;
  domain?: string;
  website?: string;
  city: string;
  state: string;
  country?: string;
  officerName: string;
  officerEmail: string;
  officerPhone: string;
  officerDesignation: string;
  password: string;
  confirmPassword?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: "student" | "placement_officer" | "admin";
  collegeId?: string;
  verificationStatus?: "pending" | "verified" | "rejected" | "suspended";
  designation?: string;
  phone?: string;
  profilePhoto?: string;
  rollNumber?: string;
  college?: string;
  course?: string;
  branch?: string;
  semester?: number;
  cgpa?: number;
  tenthMarks?: number;
  twelfthMarks?: number;
  graduationYear?: number;
  courseDuration?: string;
  backlogs?: number;
  skills?: string[];
  targetRoles?: string[];
  selectedRole?: string;
  roleSelectedAt?: string;
  aiJobRecommendations?: StudentAiRecommendations;
  resumeFileName?: string;
  resumeUploadedAt?: string;
  resumeText?: string;
  onboardingCompleted?: boolean;
  careerPreferences?: CareerPreferences;
  skillsWithLevels?: SkillWithLevel[];
  projects?: StudentProject[];
  experience?: StudentExperience;
  aiAnalysis?: AiProfileAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatchAnalysis {
  jobId: string;
  isEligible: boolean;
  eligibilityStatus: string;
  eligibilityReason: string;
  matchPercentage: number;
  fitSummary: string;
  matchedSkills: string[];
  skillGaps: string[];
  recruiterAdvice: string;
}

export interface SuggestedJobRole {
  jobId: string;
  title: string;
  company: string;
  logoText: string;
  badge: string;
  type: string;
  location: string;
  ctc: string;
  matchPercentage: number;
  isEligible: boolean;
  eligibilityStatus?: string;
  eligibilityReason?: string;
  fitSummary: string;
  matchedSkills: string[];
  skillGaps: string[];
  recruiterAdvice: string;
  category?: "Eligible Entry-Level" | "Potential Role" | "Career Growth";
  categoryLabel?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logoText: string;
  badge: string;
  type: "Full-Time" | "Internship" | "Pre-Placement Offer (PPO)";
  location: string;
  ctc: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  minCgpa: number;
  allowedBranches: string[];
  allowedQualifications?: string[];
  maxBacklogs: number;
  graduationYears: number[];
  applicationDeadline: string;
  selectionRounds: string[];
  openings: number;
  matchAnalysis?: JobMatchAnalysis;
}

export type {
  QualificationType,
  AcceptanceStatus,
  DemandLevel,
  QualificationEligibilityDetail,
  RoleMarketData,
  CareerRoleDefinition,
  CareerRecommendationInput,
  RecommendedRoleResult,
  CareerRecommendationOutput,
} from "./data/careerRecommendationEngine.js";

export interface PrioritySkillItem {
  skill: string;
  currentLevel: "Beginner" | "Intermediate" | "Advanced" | "None";
  requiredLevel: "Beginner" | "Intermediate" | "Advanced";
  priority: "High" | "Medium" | "Low";
  reason: string;
  resourceUrl?: string;
  resourceProvider?: string;
  resourceTitle?: string;
  resourceType?: string;
  resourceOptions?: Array<{
    title: string;
    provider: string;
    url: string;
    type?: string;
    reason?: string;
  }>;
}

export interface SkillGapAnalysis {
  role: string;
  strong: string[];
  developing: string[];
  needsImprovement: string[];
  missing: string[];
  prioritySkills: PrioritySkillItem[];
  analyzedAt: string;
  isAiGenerated?: boolean;
}

export interface RoadmapItem {
  id: string;
  title: string;
  category: "topic" | "project" | "coding" | "course" | "interview" | "learn" | "practice" | "assessment";
  description: string;
  skill?: string;
  topic?: string;
  priority?: "High" | "Medium" | "Low";
  reason?: string;
  source?: "mock_interview" | "skill_gap" | "onboarding" | "manual" | string;
  type?: "learn" | "practice" | "project" | "assessment" | "interview";
  estimatedTime?: string;
  linkText?: string;
  resourceUrl?: string;
  resourceProvider?: string;
  resourceTopic?: string;
  resourceType?: string;
  resourceOptions?: Array<{
    title: string;
    provider: string;
    url: string;
    type?: string;
    reason?: string;
  }>;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours?: number;
  completed: boolean;
  completedAt?: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  durationWeeks: string;
  items: RoadmapItem[];
}

export interface Roadmap {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  selectedRole?: string;
  skillGap?: SkillGapAnalysis;
  overallProgress: number;
  totalTasks?: number;
  completedTasks?: number;
  phases: RoadmapPhase[];
  customGapsIdentified: string[];
  recommendedProjects: {
    title: string;
    description: string;
    techStack: string[];
    portfolioImpact: string;
  }[];
  codingPracticePlan: {
    platform: string;
    problemTitle: string;
    topic: string;
    difficulty: "Easy" | "Medium" | "Hard";
    url?: string;
  }[];
  generatedAt: string;
  updatedAt: string;
  isAiGenerated?: boolean;
}

export interface ReadinessScore {
  id: string;
  userId: string;
  overallScore: number;
  jobReadinessPercentage: number;
  academicsScore: number;
  technicalSkillsScore: number;
  resumeScore: number | null;
  projectsScore: number;
  communicationScore: number | null;
  interviewReadinessScore: number | null;
  resumeAssessed: boolean;
  communicationAssessed: boolean;
  interviewAssessed: boolean;
  scoringRationale: {
    academicsNote: string;
    skillsNote: string;
    resumeNote: string;
    projectsNote: string;
    communicationNote: string;
    interviewNote: string;
  };
  topStrengths: string[];
  urgentActionItems: string[];
  calculatedAt: string;
}

export interface DetectedSkillGap {
  skill: string;
  topic: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

export interface RoadmapChangeNotification {
  type: "updated" | "added";
  skill: string;
  topic: string;
  previousPriority?: string;
  newPriority?: string;
  taskTitle: string;
  reason: string;
}

export interface InterviewQuestion {
  questionNumber: number;
  category: "Technical" | "System Design" | "DSA" | "Project Deep-Dive" | "CS Fundamentals" | "Behavioral" | "Problem-Solving" | "Role-Specific" | string;
  question: string;
  questionType?: "conceptual" | "follow-up" | "deep-dive" | "scenario" | "clarification" | "project" | "coding/algorithmic" | string;
  skill?: string;
  topic?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  reasonForAsking?: string;
  expectedSkill?: string;
  whatInterviewerIsLookingFor: string;
  timeLimitSeconds: number;
}

export interface InterviewQuestionReview {
  questionNumber: number;
  question: string;
  category: "Technical" | "System Design" | "DSA" | "Project Deep-Dive" | "CS Fundamentals" | "Behavioral" | "Problem-Solving" | "Role-Specific" | string;
  studentAnswer: string;
  score: number | null;
  interviewerCritique: string;
  modelAnswerKey: string;
  strengths: string[];
  improvements: string[];
  skill?: string;
  topic?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface InterviewSubScores {
  technicalKnowledge: number | null;
  problemSolving: number | null;
  communication: number | null;
  accuracy: number | null;
  depthOfUnderstanding: number | null;
  roleRelevance: number | null;
  communicationClarity?: number | null;
  confidencePacing?: number | null;
  roleAlignment?: number | null;
  roleKnowledge?: number | null;
  answerQuality?: number | null;
}

export interface InterviewReport {
  id: string;
  userId: string;
  targetRole: string;
  companyTarget?: string;
  overallScore: number | null;
  scoreAssessed?: boolean;
  subScores: InterviewSubScores;
  durationMinutes: number;
  questionsCount: number;
  questionReviews: InterviewQuestionReview[];
  coreWeaknesses: string[];
  coreStrengths: string[];
  personalizedActionPlan: string[];
  skillGapsDetected?: DetectedSkillGap[];
  roadmapChanges?: RoadmapChangeNotification[];
  transcript: {
    speaker: "interviewer" | "student";
    text: string;
    timestamp: string;
  }[];
  conductedAt: string;
}

export interface DashboardData {
  targetRole: {
    selected: boolean;
    role: string | null;
  };
  overallProgress: {
    hasSufficientData: boolean;
    roadmapCompletionPercent: number;
    completedTasksCount: number;
    totalTasksCount: number;
    interviewScore: number | null;
    interviewAssessed: boolean;
    statusSummary: string;
  };
  skills: {
    assessed: boolean;
    strong: string[];
    developing: string[];
    needsImprovement: string[];
    missing: string[];
    prioritySkills: PrioritySkillItem[];
  };
  roadmap: {
    hasRoadmap: boolean;
    id?: string;
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    nextPriority: {
      id: string;
      title: string;
      skill?: string;
      topic?: string;
      priority?: "High" | "Medium" | "Low";
      reason?: string;
      category?: string;
      phaseNumber?: number;
    } | null;
  };
  latestInterview: {
    conducted: boolean;
    id?: string;
    targetRole?: string;
    companyTarget?: string;
    score: number | null;
    scoreAssessed: boolean;
    subScores?: {
      technicalKnowledge: number;
      problemSolving: number;
      communicationClarity: number;
      confidencePacing?: number;
      roleAlignment: number;
    };
    coreStrengths: string[];
    coreWeaknesses: string[];
    conductedAt?: string;
  } | null;
  latestRoadmapUpdate: {
    hasUpdate: boolean;
    source: "mock_interview" | "profile" | string;
    updatedAt?: string;
    changes: RoadmapChangeNotification[];
  } | null;
  academic: {
    college: string;
    course: string;
    branch: string;
    semester: number;
    cgpa: number | null;
    backlogs: number;
    graduationYear: number;
  };
  resume: {
    isUploaded: boolean;
    fileName: string | null;
    uploadedAt: string | null;
    assessmentStatus: "uploaded_unassessed" | "not_uploaded" | "assessed";
    note: string;
  };
  nextAction: {
    title: string;
    description: string;
    actionLabel: string;
    targetTab: "score" | "jobs" | "roadmap" | "interview";
    reason: string;
  };
  recentActivities?: DashboardActivity[];
}

export interface DashboardActivity {
  id: string;
  type: "profile" | "role" | "skill_gap" | "roadmap" | "interview" | "resume";
  title: string;
  timestamp: string | null;
}
