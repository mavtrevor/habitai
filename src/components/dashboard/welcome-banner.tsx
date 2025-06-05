
'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from '@/lib/firebase/client';
import type { User as FirebaseUser } from 'firebase/auth';
import { Skeleton } from "@/components/ui/skeleton";

export function WelcomeBanner() {
    const [greeting, setGreeting] = useState("Hello");
    const [userName, setUserName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");

        const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setUserName(firebaseUser.displayName || "User");
            } else {
                setUserName("Guest"); // Fallback if no user is logged in
            }
            setIsLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener
    }, []);

    return (
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl md:text-3xl font-bold font-headline">{greeting}, {userName || "Explorer"}!</h1>
                            <p className="text-sm md:text-base opacity-90">Ready to conquer your habits today?</p>
                        </>
                    )}
                </div>
                <Sparkles className="h-12 w-12 opacity-80 hidden sm:block animate-subtle-pulse" />
            </CardContent>
        </Card>
    );
}
