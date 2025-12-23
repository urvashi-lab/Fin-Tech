import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, AlertCircle, Video } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "under-review" | "approved" | "rejected" | "scheduled" | "completed" | "in-progress";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const configs = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-muted text-muted-foreground",
    },
    "under-review": {
      label: "Under Review",
      icon: AlertCircle,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    scheduled: {
      label: "Scheduled",
      icon: CheckCircle2,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    "in-progress": {
      label: "In Progress",
      icon: Video,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
        config.className,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
};
