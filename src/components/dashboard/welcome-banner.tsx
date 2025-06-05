'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function WelcomeBanner({ userName }: { userName: string }) {
    const [greeting, setGreeting] = useState("Hello");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    return (
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline">{greeting}, {userName}!</h1>
                    <p className="text-sm md:text-base opacity-90">Ready to conquer your habits today?</p>
                </div>
                <Sparkles className="h-12 w-12 opacity-80 hidden sm:block animate-subtle-pulse" />
            </CardContent>
        </Card>
    );
}
