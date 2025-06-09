
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline">
            Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <p>
            Welcome to HabitAI&apos;s Terms of Service page. This is a placeholder page.
          </p>
          <p>
            Please replace this content with your actual Terms of Service. These terms govern the use of the HabitAI application and services.
          </p>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using HabitAI, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. User Conduct</h2>
            <p>
              You agree not to use the service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the service in any way that could damage the service, the reputation of HabitAI, or the general enjoyment of other users.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of HabitAI and its licensors.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">5. Termination</h2>
            <p>
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
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
