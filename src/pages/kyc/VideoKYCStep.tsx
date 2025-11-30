import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getKYCData, updateVideoKYC } from "@/lib/kyc-storage";

interface VideoKYCStepProps {
  onBack: () => void;
}

const timeSlots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
];

export default function VideoKYCStep({ onBack }: VideoKYCStepProps) {
  const kycData = getKYCData();
  const videoKYC = kycData.videoKYC;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    videoKYC.date ? new Date(videoKYC.date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState(videoKYC.timeSlot || "");
  const [isBooked, setIsBooked] = useState(videoKYC.status === "scheduled" || videoKYC.status === "completed");

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const handleBooking = () => {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select both date and time slot");
      return;
    }

    const link = `https://meet.kyc-portal.com/${Math.random().toString(36).substr(2, 9)}`;

    updateVideoKYC({
      date: format(selectedDate, "yyyy-MM-dd"),
      timeSlot: selectedSlot,
      link,
      status: "scheduled",
    });

    setIsBooked(true);
    toast.success("Video KYC scheduled successfully!");
  };

  const handleReschedule = () => {
    setIsBooked(false);
    setSelectedDate(undefined);
    setSelectedSlot("");
    updateVideoKYC({
      date: null,
      timeSlot: null,
      link: null,
      status: "pending",
    });
    toast.info("You can now select a new date and time");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Video KYC Scheduling</h2>
        {isBooked && <StatusBadge status={videoKYC.status} />}
      </div>

      {isBooked ? (
        <Card className="bg-gradient-card border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Video KYC Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Scheduled Date</p>
                <p className="font-medium">{videoKYC.date && format(new Date(videoKYC.date), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time Slot</p>
                <p className="font-medium">{videoKYC.timeSlot}</p>
              </div>
            </div>

            {videoKYC.link && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Video Call Link</p>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <a
                    href={videoKYC.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium break-all"
                  >
                    {videoKYC.link}
                  </a>
                </div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Important Instructions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ensure you have a stable internet connection</li>
                <li>Keep your original documents ready</li>
                <li>Be in a well-lit area</li>
                <li>Join the call 5 minutes before the scheduled time</li>
              </ul>
            </div>

            {videoKYC.status !== "completed" && (
              <Button variant="outline" onClick={handleReschedule} className="w-full">
                Reschedule Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  isBefore(startOfDay(date), today) || isBefore(maxDate, startOfDay(date))
                }
                className="rounded-md border shadow-sm mx-auto w-fit"
              />
              {selectedDate && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <p className="font-medium text-primary">{format(selectedDate, "PPP")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Time Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger className={!selectedDate ? "opacity-50" : ""}>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSlot && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Selected Time</p>
                  <p className="font-medium text-primary">{selectedSlot}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            onClick={handleBooking}
            disabled={!selectedDate || !selectedSlot}
            className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
          >
            <Video className="mr-2 h-5 w-5" />
            Confirm Booking
          </Button>
        </>
      )}

      <div className="flex justify-start pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
