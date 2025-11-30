export interface PersonalInfo {
  fullName: string;
  dob: string;
  gender: string;
  address: string;
  mobile: string;
  email: string;
  consent: boolean;
}

export interface DocumentInfo {
  aadharFront: string | null;
  aadharBack: string | null;
  panCard: string | null;
  aadharNumber: string;
  panNumber: string;
  issueDate: string;
}

export interface VerificationStatus {
  status: "pending" | "under-review" | "approved" | "rejected";
  remarks: string;
  reviewedAt: string | null;
}

export interface VideoKYC {
  date: string | null;
  timeSlot: string | null;
  link: string | null;
  status: "pending" | "scheduled" | "completed";
}

export interface KYCData {
  currentStep: number;
  personalInfo: PersonalInfo | null;
  documents: DocumentInfo | null;
  verification: VerificationStatus;
  videoKYC: VideoKYC;
  completedSteps: number[];
}

const KYC_STORAGE_KEY = "kyc_data";

export const getKYCData = (): KYCData => {
  const stored = localStorage.getItem(KYC_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    currentStep: 1,
    personalInfo: null,
    documents: null,
    verification: {
      status: "pending",
      remarks: "",
      reviewedAt: null,
    },
    videoKYC: {
      date: null,
      timeSlot: null,
      link: null,
      status: "pending",
    },
    completedSteps: [],
  };
};

export const saveKYCData = (data: Partial<KYCData>): void => {
  const current = getKYCData();
  const updated = { ...current, ...data };
  localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(updated));
};

export const updatePersonalInfo = (info: PersonalInfo): void => {
  const current = getKYCData();
  saveKYCData({
    personalInfo: info,
    currentStep: Math.max(current.currentStep, 2),
    completedSteps: [...new Set([...current.completedSteps, 1])],
  });
};

export const updateDocuments = (docs: DocumentInfo): void => {
  const current = getKYCData();
  saveKYCData({
    documents: docs,
    currentStep: Math.max(current.currentStep, 3),
    completedSteps: [...new Set([...current.completedSteps, 2])],
    verification: {
      status: "under-review",
      remarks: "",
      reviewedAt: null,
    },
  });
};

export const updateVerificationStatus = (
  status: "approved" | "rejected",
  remarks: string
): void => {
  const current = getKYCData();
  saveKYCData({
    verification: {
      status,
      remarks,
      reviewedAt: new Date().toISOString(),
    },
    currentStep: status === "approved" ? Math.max(current.currentStep, 4) : current.currentStep,
    completedSteps:
      status === "approved"
        ? [...new Set([...current.completedSteps, 3])]
        : current.completedSteps,
  });
};

export const updateVideoKYC = (videoKYC: VideoKYC): void => {
  const current = getKYCData();
  saveKYCData({
    videoKYC,
    completedSteps: [...new Set([...current.completedSteps, 4])],
  });
};

export const resetKYC = (): void => {
  localStorage.removeItem(KYC_STORAGE_KEY);
};

export const getCompletionPercentage = (): number => {
  const data = getKYCData();
  return (data.completedSteps.length / 4) * 100;
};
