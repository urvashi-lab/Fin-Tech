import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileCheck, Video, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">KYC Portal</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="bg-gradient-hero hover:opacity-90 transition-opacity" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete Your KYC Verification
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Fast, secure, and compliant identity verification in 4 simple steps
          </p>
          <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity text-lg px-8" asChild>
            <Link to="/signup">Start Verification</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {[
            {
              icon: FileCheck,
              title: "Personal Info",
              description: "Provide your basic details and contact information",
            },
            {
              icon: ShieldCheck,
              title: "Documents",
              description: "Upload Aadhar and PAN cards securely",
            },
            {
              icon: CheckCircle,
              title: "Review",
              description: "Automated verification of your documents",
            },
            {
              icon: Video,
              title: "Video KYC",
              description: "Schedule a quick video verification call",
            },
          ].map((step, index) => (
            <Card key={index} className="text-center shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-3xl mx-auto shadow-lg bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-2xl">Why Choose Our KYC Process?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Bank-grade security with encrypted data storage",
              "Real-time document verification",
              "Resume from where you left off",
              "Mobile-friendly interface",
              "Compliance with regulatory standards",
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-foreground">{feature}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 KYC Portal. Secure identity verification platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
