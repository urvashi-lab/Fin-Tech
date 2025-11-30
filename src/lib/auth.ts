export interface User {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const getAuthState = (): AuthState => {
  const user = localStorage.getItem("kyc_user");
  return {
    isAuthenticated: !!user,
    user: user ? JSON.parse(user) : null,
  };
};

export const signup = (user: User): { success: boolean; error?: string } => {
  try {
    const existingUsers = localStorage.getItem("kyc_users");
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    
    // Check if email or mobile already exists
    const emailExists = users.some(u => u.email === user.email);
    const mobileExists = users.some(u => u.mobile === user.mobile);
    
    if (emailExists) {
      return { success: false, error: "Email already registered" };
    }
    
    if (mobileExists) {
      return { success: false, error: "Mobile number already registered" };
    }
    
    users.push(user);
    localStorage.setItem("kyc_users", JSON.stringify(users));
    localStorage.setItem("kyc_user", JSON.stringify(user));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create account" };
  }
};

export const login = (
  identifier: string,
  password: string
): { success: boolean; error?: string; user?: User } => {
  try {
    const existingUsers = localStorage.getItem("kyc_users");
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    
    const user = users.find(
      u =>
        (u.email === identifier || u.mobile === identifier) &&
        u.password === password
    );
    
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }
    
    localStorage.setItem("kyc_user", JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false, error: "Login failed" };
  }
};

export const logout = (): void => {
  localStorage.removeItem("kyc_user");
};
