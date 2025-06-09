
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline">
            Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <p>
            Welcome to HabitAI&apos;s Privacy Policy page. This is a placeholder page.
          </p>
          <p>
            Please replace this content with your actual Privacy Policy. It should detail how you collect, use, store, and protect user data.
          </p>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
            <p>
              Specify the types of personal and non-personal information you collect (e.g., email, name, usage data, device information).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
            <p>
              Explain the purposes for which you collect data (e.g., to provide services, personalize experience, analytics, communication).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Sharing and Disclosure</h2>
            <p>
              Describe if and how you share data with third parties (e.g., service providers, legal requirements).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Security</h2>
            <p>
              Outline the measures you take to protect user data.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">5. User Rights</h2>
            <p>
              Inform users about their rights regarding their data (e.g., access, correction, deletion).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Us</h2>
            <p>
              Provide contact information for privacy-related inquiries.
            </p>
          </section>
          <p className="mt-8">
            <em>Last updated: {new Date().toLocaleDateString()}</em>
          </p>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
