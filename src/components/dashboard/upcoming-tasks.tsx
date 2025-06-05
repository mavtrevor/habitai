import type { Habit } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Lightbulb } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "../ui/scroll-area";

interface UpcomingTasksProps {
    habits: Habit[];
}

export function UpcomingTasks({ habits }: UpcomingTasksProps) {
    // Filter for habits that are not completed today or have AI suggestions
    // This is a simplified logic
    const today = new Date().toISOString().slice(0,10);
    const relevantHabits = habits.filter(habit => {
        const todayProgress = habit.progress.find(p => p.date.startsWith(today));
        return (!todayProgress || !todayProgress.completed) || habit.aiSuggestedTask;
    }).slice(0, 5); // Limit to 5 tasks

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold font-headline flex items-center">
                    <ListTodo className="mr-2 h-5 w-5 text-primary" />
                    Today's Focus
                </CardTitle>
                <CardDescription>
                    AI suggested tasks and upcoming habits for today.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {relevantHabits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">All caught up for today, or no specific suggestions! Great job!</p>
                ) : (
                    <ScrollArea className="h-[200px] pr-3">
                        <ul className="space-y-3">
                            {relevantHabits.map(habit => (
                                <li key={habit.id} className="text-sm p-3 bg-secondary/50 rounded-md shadow-sm">
                                    <Link href={`/habits#${habit.id}`} className="font-medium text-foreground hover:text-primary block">
                                        {habit.title}
                                    </Link>
                                    {habit.aiSuggestedTask && (
                                        <p className="text-xs text-muted-foreground flex items-start mt-1">
                                            <Lightbulb className="h-3 w-3 mr-1.5 mt-0.5 text-accent flex-shrink-0" />
                                            {habit.aiSuggestedTask}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
