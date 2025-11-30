import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface KYCStepperProps {
  currentStep: number;
  completedSteps: number[];
}

const steps: Step[] = [
  { number: 1, title: "Personal Info", description: "Basic details" },
  { number: 2, title: "Documents", description: "ID verification" },
  { number: 3, title: "Review", description: "Verification status" },
  { number: 4, title: "Video KYC", description: "Schedule call" },
];

export const KYCStepper = ({ currentStep, completedSteps }: KYCStepperProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  completedSteps.includes(step.number)
                    ? "bg-success border-success text-success-foreground"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-primary-foreground shadow-md scale-110"
                    : currentStep > step.number
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {completedSteps.includes(step.number) ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    currentStep === step.number
                      ? "text-foreground"
                      : completedSteps.includes(step.number)
                      ? "text-success"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-all duration-300 mx-2",
                  completedSteps.includes(step.number)
                    ? "bg-success"
                    : currentStep > step.number
                    ? "bg-primary/50"
                    : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
