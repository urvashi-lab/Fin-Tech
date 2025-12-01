import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { signup } from "@/lib/auth";
import {
  validateFullName,
  validateEmail,
  validateMobile,
  validatePassword,
} from "@/lib/validation";
import { ShieldCheck } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    mobile: false,
    password: false,
  });

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "fullName":
        error = validateFullName(value) || "";
        break;
      case "email":
        error = validateEmail(value) || "";
        break;
      case "mobile":
        error = validateMobile(value) || "";
        break;
      case "password":
        error = validatePassword(value) || "";
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name as keyof typeof touched]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const isFormValid = () => {
    return (
      validateFullName(formData.fullName) === null &&
      validateEmail(formData.email) === null &&
      validateMobile(formData.mobile) === null &&
      validatePassword(formData.password) === null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      mobile: true,
      password: true,
    });

    if (!isFormValid()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    const result = signup(formData);
    
    if (result.success) {
      toast.success("Account created successfully!");
      navigate("/kyc-dashboard");
    } else {
      toast.error(result.error || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to start your KYC verification process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.fullName && touched.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && touched.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.email && touched.email ? "border-destructive" : ""}
              />
              {errors.email && touched.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                name="mobile"
                placeholder="9876543210"
                maxLength={10}
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.mobile && touched.mobile ? "border-destructive" : ""}
              />
              {errors.mobile && touched.mobile && (
                <p className="text-sm text-destructive">{errors.mobile}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.password && touched.password ? "border-destructive" : ""}
              />
              {errors.password && touched.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
              disabled={!isFormValid()}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}