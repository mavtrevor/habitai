
'use client';

import type { FC } from 'react';
import React, { useState, FormEvent, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { suggestHabitMicroTask, addHabit, updateHabit } from '@/lib/firebase'; // Use real Firebase functions
import type { SuggestHabitMicroTaskInput } from '@/ai/flows/suggest-habit-micro-task';
import type { Habit } from '@/types';
import { Loader2, Wand2, Zap, PlusCircle, ListChecks, Activity, Award, Bike, BookOpen, CalendarCheck2, CheckCircle2, ClipboardList, Coffee, Dumbbell, Feather, Flame, Heart, Home, Lightbulb, Moon, Mountain, Music, Pencil, Plane, Smile, Sparkles, Star, Sun, Target, Trophy, Utensils, Watch, Edit3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { ColorResult } from 'react-color';
import dynamic from 'next/dynamic';
import type { LucideProps } from 'lucide-react';

const TwitterPicker = dynamic(() => import('react-color').then(mod => mod.TwitterPicker), { 
  ssr: false,
  loading: () => <div className="h-[154px] w-[276px] animate-pulse rounded-md bg-muted" /> 
});

const curatedIcons: Record<string, React.FC<LucideProps>> = {
  Activity, Award, Bike, BookOpen, CalendarCheck2, CheckCircle2, ClipboardList, Coffee, Dumbbell, Feather, Flame, Heart, Home, Lightbulb, ListChecks, Moon, Mountain, Music, Pencil, Plane, Smile, Sparkles, Star, Sun, Target, Trophy, Utensils, Watch, Zap
};
const habitIconNames = Object.keys(curatedIcons);

const IconPickerComponent: FC<{ name?: string } & LucideProps> = React.memo(({ name, ...props }) => {
  const IconComponent = name && curatedIcons[name] ? curatedIcons[name] : ListChecks;
  return <IconComponent {...props} />;
});
IconPickerComponent.displayName = 'IconPickerComponent';

interface HabitCreatorFormProps {
  habitToEdit?: Habit;
  mode?: 'create' | 'edit';
}

export const HabitCreatorForm: FC<HabitCreatorFormProps> = React.memo(({ habitToEdit, mode = 'create' }) => {
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]); // Still used for AI suggestion, not directly stored on Habit model yet
  const [difficulty, setDifficulty] = useState('medium'); // Still used for AI suggestion
  const [frequency, setFrequency] = useState('daily');
  const [customFrequency, setCustomFrequency] = useState('');
  
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [selectedIcon, setSelectedIcon] = useState<string>('ListChecks');
  const [selectedColor, setSelectedColor] = useState<string>('#29ABE2'); 

  useEffect(() => {
    if (mode === 'edit' && habitToEdit) {
      setGoal(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      
      const standardFrequencies = ['daily', 'weekly', 'weekdays', 'weekends'];
      if (standardFrequencies.includes(habitToEdit.frequency)) {
        setFrequency(habitToEdit.frequency);
        setCustomFrequency('');
      } else {
        setFrequency('custom');
        setCustomFrequency(habitToEdit.frequency);
      }
      
      setAiSuggestion(habitToEdit.aiSuggestedTask || '');
      setSelectedIcon(habitToEdit.icon || 'ListChecks');
      setSelectedColor(habitToEdit.color || '#29ABE2');
      // availableTimes and difficulty are not part of Habit type, so they aren't prefilled
      // but they could be if added to the Habit type and stored
    }
  }, [mode, habitToEdit]);


  const handleTimeChange = useCallback((time: string) => {
    setAvailableTimes(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  }, []);

  const fetchAiSuggestion = useCallback(async () => {
    if (!goal) {
      toast({ title: 'Goal Required', description: 'Please enter a habit goal to get suggestions.', variant: 'destructive' });
      return;
    }
    setIsFetchingSuggestion(true);
    setAiSuggestion('');
    try {
      const input: SuggestHabitMicroTaskInput = { 
        goal, 
        times: availableTimes, 
        preferences: { difficulty } 
      };
      const result = await suggestHabitMicroTask(input); // Calls actual Genkit flow via firebase.ts
      setAiSuggestion(result.microTaskSuggestion || 'AI could not generate a suggestion for this input.');
    } catch (error: any) {
      toast({ title: 'AI Suggestion Error', description: error.message || 'Could not fetch AI suggestion.', variant: 'destructive' });
    } finally {
      setIsFetchingSuggestion(false);
    }
  }, [goal, availableTimes, difficulty, toast]);

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const finalFrequency = frequency === 'custom' ? customFrequency : frequency;

    try {
      if (mode === 'edit' && habitToEdit) {
        const updatedHabitData: Habit = {
          ...habitToEdit, // Spread existing habit to keep progress, streak, userId, createdAt etc.
          title: goal,
          description,
          frequency: finalFrequency,
          aiSuggestedTask: aiSuggestion,
          icon: selectedIcon,
          color: selectedColor,
        };
        await updateHabit(updatedHabitData); // This now calls Firestore update
        toast({ title: 'Habit Updated!', description: `${goal} has been updated.` });
      } else {
        const newHabitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId' | 'lastUpdatedAt'> = {
          title: goal,
          description,
          frequency: finalFrequency,
          aiSuggestedTask: aiSuggestion,
          icon: selectedIcon,
          color: selectedColor,
        };
        await addHabit(newHabitData); // This now calls Firestore add
        toast({ title: 'Habit Created!', description: `${goal} has been added to your habits.` });
      }
      
      if (mode === 'create') {
        setGoal('');
        setDescription('');
        setAiSuggestion('');
        setAvailableTimes([]);
        setFrequency('daily');
        setCustomFrequency('');
        setDifficulty('medium');
        setSelectedIcon('ListChecks');
        setSelectedColor('#29ABE2');
      }
      
      router.push('/habits'); // Navigate to habits list

    } catch (error: any) {
      toast({ title: `Error ${mode === 'edit' ? 'Updating' : 'Creating'} Habit`, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [goal, description, frequency, customFrequency, aiSuggestion, selectedIcon, selectedColor, toast, router, availableTimes, difficulty, mode, habitToEdit]);
  
  const handleColorChange = useCallback((color: ColorResult) => {
    setSelectedColor(color.hex);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="goal" className="text-lg font-medium">Habit Goal</Label>
        <Input
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Exercise daily, Read more books"
          required
          className="mt-1 text-base"
          disabled={isSubmitting}
        />
         <p className="text-xs text-muted-foreground mt-1">What positive change do you want to make?</p>
      </div>

      <div>
        <Label htmlFor="description" className="text-base">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Go for a 30-minute run or do a home workout session."
          className="mt-1"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-base mb-2 block">Icon & Color</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-16 h-10 flex items-center justify-center" disabled={isSubmitting}>
                  <IconPickerComponent name={selectedIcon} style={{ color: selectedColor }} className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                 {typeof window !== 'undefined' && TwitterPicker && <TwitterPicker color={selectedColor} onChangeComplete={handleColorChange} triangle="hide" />}
              </PopoverContent>
            </Popover>
            <Select value={selectedIcon} onValueChange={setSelectedIcon} disabled={isSubmitting}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Icon" />
              </SelectTrigger>
              <SelectContent>
                {habitIconNames.map(iconName => ( 
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      <IconPickerComponent name={iconName} className="h-4 w-4" /> {iconName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="frequency" className="text-base">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency} disabled={isSubmitting}>
            <SelectTrigger id="frequency" className="mt-1">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
              <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {frequency === 'custom' && (
            <Input
              type="text"
              value={customFrequency}
              onChange={(e) => setCustomFrequency(e.target.value)}
              placeholder="e.g., 3 times a week, Every Mon, Wed, Fri"
              className="mt-2"
              disabled={isSubmitting}
            />
          )}
        </div>
      </div>


      <div>
        <Label className="text-base">Available Times (Optional for AI)</Label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Morning', 'Afternoon', 'Evening', 'Anytime'].map(time => (
            <Button 
              key={time} 
              type="button" 
              variant={availableTimes.includes(time.toLowerCase()) ? "default" : "outline"}
              onClick={() => handleTimeChange(time.toLowerCase())}
              className="w-full"
              disabled={isSubmitting || isFetchingSuggestion}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="difficulty" className="text-base">Preferred Task Difficulty (Optional for AI)</Label>
        <Select value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting || isFetchingSuggestion}>
          <SelectTrigger id="difficulty" className="mt-1">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="challenging">Challenging</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 p-4 border border-dashed border-accent/50 rounded-lg bg-accent/5">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium text-accent flex items-center">
            <Wand2 className="h-5 w-5 mr-2" /> AI Micro-Task Suggestion
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={fetchAiSuggestion} disabled={isFetchingSuggestion || !goal || isSubmitting} className="text-accent border-accent hover:bg-accent/10">
            {isFetchingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Suggest Task
          </Button>
        </div>
        {isFetchingSuggestion && <div className="h-10 w-full animate-pulse rounded-md bg-muted" />}
        {!isFetchingSuggestion && aiSuggestion && (
          <div className="p-3 bg-accent/10 rounded-md">
            <p className="text-sm text-accent">{aiSuggestion}</p>
          </div>
        )}
        {!isFetchingSuggestion && !aiSuggestion && (
          <p className="text-sm text-muted-foreground">Click "Suggest Task" to get an AI-powered micro-task for your goal.</p>
        )}
      </div>


      <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || !goal} size="lg">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : mode === 'edit' ? (
          <Edit3 className="mr-2 h-5 w-5" />
        ) : (
          <PlusCircle className="mr-2 h-5 w-5" />
        )}
        {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create Habit')}
      </Button>
    </form>
  );
});
HabitCreatorForm.displayName = 'HabitCreatorForm';
