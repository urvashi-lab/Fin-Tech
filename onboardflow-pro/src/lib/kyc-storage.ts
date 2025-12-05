export interface DocumentInfo {
  aadharFront: string | null;
  aadharBack: string | null;
  panFront: string | null;
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

export interface BankApproval {
  status: "pending" | "approved" | "rejected";
  remarks: string;
  timestamp: string | null;
  applicationId?: string;
}

export interface PersonalInfo {
  fullName: string;
  dob: string;
  gender: string;
  address: string;
  mobile: string;
  email: string;
  consent: boolean;
}

export interface KYCData {
  currentStep: number;
  personalInfo: PersonalInfo | null;
  documents: DocumentInfo | null;
  verification: VerificationStatus;
  videoKYC: VideoKYC;
  bankApproval?: BankApproval;
  completedSteps: number[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// ===== PERSONAL INFO API CALLS =====

export const getPersonalInfo = async (): Promise<PersonalInfo | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/personal-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch personal info');
    }

    const result = await response.json();
    
    // Map backend response to frontend format
    const data = result.data;
    return {
      fullName: data.fullName,
      dob: data.dob,
      gender: data.gender || "",
      address: data.address,
      mobile: data.phone, // backend uses 'phone', frontend uses 'mobile'
      email: data.email || "",
      consent: true,
    };
  } catch (error) {
    console.error('Error fetching personal info:', error);
    return null;
  }
};

export const updatePersonalInfo = async (info: PersonalInfo): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Map frontend fields to backend fields
    const payload = {
      fullName: info.fullName,
      dob: info.dob,
      gender: info.gender,
      address: info.address,
      phone: info.mobile, // frontend uses 'mobile', backend uses 'phone'
    };

    console.log('API URL:', `${API_BASE_URL}/personal-info`);
    console.log('Payload:', payload);

    const response = await fetch(`${API_BASE_URL}/personal-info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    // Get response text first to see what we're receiving
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
      }
      throw new Error(errorData.message || 'Failed to update personal info');
    }

    const result = JSON.parse(responseText);
    return result.success;
  } catch (error) {
    console.error('Error updating personal info:', error);
    throw error;
  }
};

// ===== DOCUMENTS API CALLS =====

export const getDocuments = async (): Promise<DocumentInfo | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/document`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch documents');
    }

    const result = await response.json();
    const data = result.document;
    
    return {
      aadharFront: data.aadharFront,
      aadharBack: data.aadharBack,
      panFront: data.panFront,
      aadharNumber: data.aadharNumber,
      panNumber: data.panNumber,
      issueDate: data.issueDate,
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return null;
  }
};

// ===== COMBINED API CALL FOR KYC DATA =====

export const getKYCDataFromAPI = async (): Promise<KYCData> => {
  // Fetch personal info and documents from API
  const [personalInfo, documents] = await Promise.all([
    getPersonalInfo(),
    getDocuments(),
  ]);

  // Get verification, videoKYC, and bankApproval from localStorage (temporary)
  const localData = getKYCDataFromLocalStorage();

  return {
    currentStep: localData.currentStep,
    personalInfo,
    documents,
    verification: localData.verification,
    videoKYC: localData.videoKYC,
    bankApproval: localData.bankApproval,
    completedSteps: localData.completedSteps,
  };
};

// ===== TEMPORARY: LOCALSTORAGE FUNCTIONS =====
// These are used for verification, videoKYC, bankApproval until backend is ready

const KYC_STORAGE_KEY = "kyc_data";

const getKYCDataFromLocalStorage = (): KYCData => {
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
    bankApproval: {
      status: "pending",
      remarks: "",
      timestamp: null,
    },
    completedSteps: [],
  };
};

// DEPRECATED: Use getKYCDataFromAPI() instead
// Keeping this for backward compatibility with other components
export const getKYCData = (): KYCData => {
  return getKYCDataFromLocalStorage();
};

export const saveKYCData = (data: Partial<KYCData>): void => {
  const current = getKYCDataFromLocalStorage();
  const updated = { ...current, ...data };
  localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(updated));
};

export const updateDocuments = (docs: DocumentInfo): void => {
  const current = getKYCDataFromLocalStorage();
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
  const current = getKYCDataFromLocalStorage();
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
  const current = getKYCDataFromLocalStorage();
  saveKYCData({
    videoKYC,
    currentStep: Math.max(current.currentStep, 5),
    completedSteps: [...new Set([...current.completedSteps, 4])],
    bankApproval: {
      status: "pending",
      remarks: "",
      timestamp: null,
    },
  });
};

export const updateBankApprovalStatus = (
  status: "pending" | "approved" | "rejected",
  remarks: string
): void => {
  const current = getKYCDataFromLocalStorage();
  saveKYCData({
    bankApproval: {
      status,
      remarks,
      timestamp: new Date().toISOString(),
      applicationId: `KYC-${Date.now().toString().slice(-8)}`,
    },
    completedSteps:
      status === "approved"
        ? [...new Set([...current.completedSteps, 5])]
        : current.completedSteps,
  });
};

export const resetKYC = (): void => {
  localStorage.removeItem(KYC_STORAGE_KEY);
};

export const getCompletionPercentage = (): number => {
  const data = getKYCDataFromLocalStorage();
  return (data.completedSteps.length / 5) * 100;
};