import { HabitCreatorForm } from '@/components/habits/habit-creator-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function CreateHabitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center">
            <Lightbulb className="mr-3 h-7 w-7 text-yellow-400" />
            Create a New Habit
          </CardTitle>
          <CardDescription>
            Define your goal, and let our AI help you craft the perfect micro-tasks to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HabitCreatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
