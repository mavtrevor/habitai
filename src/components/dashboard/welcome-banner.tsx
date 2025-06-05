
'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface WelcomeBannerProps {
    userName: string | null | undefined; // Accept userName as a prop
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
    const [greeting, setGreeting] = useState("Hello");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");

        // Determine loading state based on userName prop
        if (userName === undefined) { // Still loading from parent
            setIsLoading(true);
        } else {
            setIsLoading(false);
        }
    }, [userName]);

    return (
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-8 w-48 mb-2 bg-primary/30" />
                            <Skeleton className="h-4 w-64 bg-primary/30" />
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
