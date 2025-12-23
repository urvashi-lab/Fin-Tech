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
  status: "pending" | "in-progress" | "completed";
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

    const payload = {
      fullName: info.fullName,
      dob: info.dob,
      gender: info.gender,
      email: info.email,
      address: info.address,
      phone: info.mobile,
    };

    const response = await fetch(`${API_BASE_URL}/personal-info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        throw new Error(`Server error: ${response.status}`);
      }
      throw new Error(errorData.message || 'Failed to update personal info');
    }

    const result = await response.json();
    
    // ✅ ADD THIS: Mark step 1 as completed in localStorage
    const current = getKYCDataFromLocalStorage();
    saveKYCData({
      currentStep: Math.max(current.currentStep, 2),
      completedSteps: [...new Set([...current.completedSteps, 1])], // Mark step 1 complete
    });
    
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

// ===== VERIFICATION API CALLS (NEW - HITTING BACKEND) =====


// ===== VERIFICATION API CALLS (FIXED) =====

export const verifyAadhar = async (aadharNumber: string): Promise<{ success: boolean; message: string }> => {
  console.log("🔵 verifyAadhar function called");
  console.log("  - Aadhar Number:", aadharNumber);
  
  try {
    const token = getAuthToken();
    console.log("  - Token exists:", !!token);
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/kyc/verify/aadhar/back`;
    console.log("  - API URL:", url);
    console.log("  - Request body:", { aadharNumber });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aadharNumber }),
    });

    console.log("  - Response status:", response.status);
    console.log("  - Response ok:", response.ok);

    const data = await response.json();
    console.log("  - Response data:", data);
    
    const result = {
      success: response.ok && data.success,
      message: data.message || 'Aadhar verification completed',
    };
    
    console.log("  - Final result:", result);
    return result;
  } catch (error) {
    console.error('❌ Error verifying Aadhar:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Aadhar verification failed due to network error',
    };
  }
};

export const verifyPAN = async (panNumber: string): Promise<{ success: boolean; message: string }> => {
  console.log("🔵 verifyPAN function called");
  console.log("  - PAN Number:", panNumber);
  
  try {
    const token = getAuthToken();
    console.log("  - Token exists:", !!token);
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/kyc/verify/pancard`;
    console.log("  - API URL:", url);
    console.log("  - Request body:", { panNumber });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ panNumber }),
    });

    console.log("  - Response status:", response.status);
    console.log("  - Response ok:", response.ok);

    const data = await response.json();
    console.log("  - Response data:", data);
    
    const result = {
      success: response.ok && data.success,
      message: data.message || 'PAN verification completed',
    };
    
    console.log("  - Final result:", result);
    return result;
  } catch (error) {
    console.error('❌ Error verifying PAN:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'PAN verification failed due to network error',
    };
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

// ===== LOCALSTORAGE FUNCTIONS =====
// These are used for verification status, videoKYC, bankApproval, steps tracking

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

// UPDATED: Now just updates localStorage after backend verification
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

export const updateVideoKYC = (updates: Partial<VideoKYC>): void => {
  const current = getKYCDataFromLocalStorage();
  saveKYCData({
    ...current,
    videoKYC: {
      ...current.videoKYC,
      ...updates,
    },
    currentStep: Math.max(current.currentStep, 5),
    completedSteps: [...new Set([...current.completedSteps, 4])],
  });
};

export const sendFrameForVerification = async (
  frameData: string,
  verificationType: "face" | "aadhaar-front" | "aadhaar-back" | "pan",
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`📤 [MOCK] Verifying ${verificationType} frame...`);
    console.log(`📸 Frame data length: ${frameData.length} characters`);
    
    // Simulate API delay (optional - makes it feel more realistic)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // HARDCODED SUCCESS RESPONSE
    const mockMessages = {
      "face": "✅ Face verification successful",
      "aadhaar-front": "✅ Aadhaar front side verified",
      "aadhaar-back": "✅ Aadhaar back side verified",
      "pan": "✅ PAN card verified successfully"
    };

    console.log(`📥 [MOCK] Verification passed for ${verificationType}`);

    return {
      success: true,
      message: mockMessages[verificationType]
    };
    
  } catch (error) {
    console.error(`❌ Error in mock verification:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

/**
 * TypeScript interface for verification result
 */
export interface VerificationResult {
  success: boolean;
  message: string;
}

/**
 * Verification types enum for type safety
 */
export type VerificationType = "face" | "aadhaar-front" | "aadhaar-back" | "pan";

export const updateBankApprovalStatus = (
  status: "pending" | "approved" | "rejected",
  remarks: string
): void => {
  console.log("🏦 [MOCK] Updating bank approval status to:", status);
  
  const current = getKYCDataFromLocalStorage();
  
  // HARDCODED: Always set to approved
  saveKYCData({
    bankApproval: {
      status: "approved", // Force approved
      remarks: "Your application has been approved by the bank. Welcome aboard!",
      timestamp: new Date().toISOString(),
      applicationId: `KYC-${Date.now().toString().slice(-8)}`,
    },
    completedSteps: [...new Set([...current.completedSteps, 5])], // Always mark as complete
  });
  
  console.log("✅ [MOCK] Bank approval hardcoded to: approved");
};

export const resetKYC = (): void => {
  localStorage.removeItem(KYC_STORAGE_KEY);
};

export const getCompletionPercentage = (): number => {
  const data = getKYCDataFromLocalStorage();
  return (data.completedSteps.length / 5) * 100;
};