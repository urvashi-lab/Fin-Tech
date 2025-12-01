export const validateFullName = (name: string): string | null => {
  if (!name || name.trim().length < 3) {
    return "Name must be at least 3 characters";
  }
  if (!/^[A-Za-z\s]+$/.test(name)) {
    return "Name can only contain letters and spaces";
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return null;
};

export const validateMobile = (mobile: string): string | null => {
  if (!mobile) {
    return "Mobile number is required";
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return "Mobile must be 10 digits starting with 6-9";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least 1 uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least 1 lowercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least 1 number";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least 1 special character";
  }
  return null;
};

export const validateAadhar = (aadhar: string): string | null => {
  const cleaned = aadhar.replace(/\s/g, "");
  if (!cleaned) {
    return "Aadhar number is required";
  }
  if (!/^\d{12}$/.test(cleaned)) {
    return "Aadhar must be exactly 12 digits";
  }
  return null;
};

export const validatePAN = (pan: string): string | null => {
  if (!pan) {
    return "PAN number is required";
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
    return "Invalid PAN format (e.g., ABCDE1234F)";
  }
  return null;
};

export const validateAge = (dob: Date): string | null => {
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (
    age < 18 ||
    (age === 18 && monthDiff < 0) ||
    (age === 18 && monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    return "You must be at least 18 years old";
  }
  
  if (dob > today) {
    return "Date of birth cannot be in the future";
  }
  
  return null;
};

export const validateAddress = (address: string): string | null => {
  if (!address || address.trim().length < 10) {
    return "Address must be at least 10 characters";
  }
  return null;
};

export const validateFileType = (file: File): string | null => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG, and PDF files are allowed";
  }
  return null;
};

export const validateFileSize = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return "File size must not exceed 5MB";
  }
  return null;
};

export const formatAadhar = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.slice(0, 12);
  const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited;
  return formatted;
};

export const formatPAN = (value: string): string => {
  return value.toUpperCase().slice(0, 10);
};