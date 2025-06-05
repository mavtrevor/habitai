import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
    return (
        <Card className="mb-6 shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold font-headline">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button asChild variant="outline" className="justify-start">
                    <Link href="/habits/create">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Habit
                    </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                    <Link href="/community">
                        <BookOpen className="mr-2 h-4 w-4" /> Community
                    </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                    <Link href="/challenges">
                        <Trophy className="mr-2 h-4 w-4" /> Challenges
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
