import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getKYCData, updatePersonalInfo } from "@/lib/kyc-storage";
import {
  validateFullName,
  validateEmail,
  validateMobile,
  validateAddress,
  validateAge,
} from "@/lib/validation";

interface PersonalInfoStepProps {
  onNext: () => void;
}

export default function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
  const existingData = getKYCData().personalInfo;
  
  const [formData, setFormData] = useState({
    fullName: existingData?.fullName || "",
    dob: existingData?.dob || "",
    gender: existingData?.gender || "",
    address: existingData?.address || "",
    mobile: existingData?.mobile || "",
    email: existingData?.email || "",
    consent: existingData?.consent || false,
  });

  const [errors, setErrors] = useState({
    fullName: "",
    dob: "",
    address: "",
    mobile: "",
    email: "",
  });

  const [touched, setTouched] = useState({
    fullName: false,
    dob: false,
    address: false,
    mobile: false,
    email: false,
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
      case "address":
        error = validateAddress(value) || "";
        break;
      case "dob":
        if (value) {
          error = validateAge(new Date(value)) || "";
        } else {
          error = "Date of birth is required";
        }
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (typeof value === "string" && touched[name as keyof typeof touched]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const isFormValid = () => {
    return (
      validateFullName(formData.fullName) === null &&
      validateEmail(formData.email) === null &&
      validateMobile(formData.mobile) === null &&
      validateAddress(formData.address) === null &&
      formData.dob &&
      validateAge(new Date(formData.dob)) === null &&
      formData.consent
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      fullName: true,
      dob: true,
      address: true,
      mobile: true,
      email: true,
    });

    if (!isFormValid()) {
      toast.error("Please fix all errors before continuing");
      return;
    }

    updatePersonalInfo(formData);
    toast.success("Personal information saved!");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            onBlur={(e) => handleBlur("fullName", e.target.value)}
            placeholder="John Doe"
            className={errors.fullName && touched.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && touched.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dob && "text-muted-foreground",
                  errors.dob && touched.dob && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dob ? format(new Date(formData.dob), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.dob ? new Date(formData.dob) : undefined}
                onSelect={(date) => {
                  const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                  handleChange("dob", dateStr);
                  handleBlur("dob", dateStr);
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.dob && touched.dob && (
            <p className="text-sm text-destructive">{errors.dob}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => handleChange("mobile", e.target.value)}
            onBlur={(e) => handleBlur("mobile", e.target.value)}
            placeholder="9876543210"
            maxLength={10}
            className={errors.mobile && touched.mobile ? "border-destructive" : ""}
          />
          {errors.mobile && touched.mobile && (
            <p className="text-sm text-destructive">{errors.mobile}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            placeholder="john@example.com"
            className={errors.email && touched.email ? "border-destructive" : ""}
          />
          {errors.email && touched.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={(e) => handleBlur("address", e.target.value)}
            placeholder="Enter your full address"
            className={cn(
              "min-h-[100px]",
              errors.address && touched.address && "border-destructive"
            )}
          />
          {errors.address && touched.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>
      </div>

      <div className="flex items-start space-x-2 p-4 border rounded-lg bg-muted/50">
        <Checkbox
          id="consent"
          checked={formData.consent}
          onCheckedChange={(checked) => handleChange("consent", !!checked)}
        />
        <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
          I consent to the collection and processing of my personal information for KYC
          verification purposes. <span className="text-destructive">*</span>
        </Label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid()}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          Continue to Documents
        </Button>
      </div>
    </form>
  );
}
