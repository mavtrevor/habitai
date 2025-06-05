
'use client';

import type { FC } from 'react';
import React, { useState, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { suggestHabitMicroTask, addHabit as mockAddHabit } from '@/lib/firebase';
import type { SuggestHabitMicroTaskInput } from '@/ai/flows/suggest-habit-micro-task';
import type { Habit } from '@/types';
import { Loader2, Wand2, Zap, PlusCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { mockHabits } from '@/lib/mock-data';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { ColorResult } from 'react-color';
import dynamic from 'next/dynamic';

const TwitterPicker = dynamic(() => import('react-color').then(mod => mod.TwitterPicker), { ssr: false });

const habitIcons = Object.keys(LucideIcons).filter(key => /^[A-Z]/.test(key) && !key.includes("Lucide") && !key.includes("Icon"));

const IconPickerComponent: FC<{ name?: string } & LucideIcons.LucideProps> = React.memo(({ name, ...props }) => {
  if (!name || !(name in LucideIcons)) {
    return <LucideIcons.ListChecks {...props} />; 
  }
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  return <Icon {...props} />;
});
IconPickerComponent.displayName = 'IconPickerComponent';


export const HabitCreatorForm: FC = () => {
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [frequency, setFrequency] = useState('daily');
  const [customFrequency, setCustomFrequency] = useState('');
  
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [selectedIcon, setSelectedIcon] = useState<string>('ListChecks');
  const [selectedColor, setSelectedColor] = useState<string>('#29ABE2'); 


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
      const result = await suggestHabitMicroTask(input);
      setAiSuggestion(result.microTaskSuggestion || 'AI could not generate a suggestion for this input.');
    } catch (error) {
      toast({ title: 'AI Suggestion Error', description: 'Could not fetch AI suggestion.', variant: 'destructive' });
    } finally {
      setIsFetchingSuggestion(false);
    }
  }, [goal, availableTimes, difficulty, toast]);

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const finalFrequency = frequency === 'custom' ? customFrequency : frequency;

    const newHabitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId'> = {
      title: goal,
      description,
      frequency: finalFrequency,
      aiSuggestedTask: aiSuggestion,
      icon: selectedIcon,
      color: selectedColor,
    };
    
    try {
      console.log("New Habit:", { ...newHabitData, userId: 'user123' }); 
      mockHabits.push({ ...newHabitData, id: `habit${Date.now()}`, createdAt: new Date().toISOString(), progress: [], streak: 0, userId: 'user123' });

      toast({ title: 'Habit Created!', description: `${goal} has been added to your habits.` });
      setGoal('');
      setDescription('');
      setAiSuggestion('');
      setAvailableTimes([]);
      if (typeof window !== 'undefined') {
        window.location.href = '/habits';
      }

    } catch (error: any) {
      toast({ title: 'Error Creating Habit', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [goal, description, frequency, customFrequency, aiSuggestion, selectedIcon, selectedColor, toast]);
  
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
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-base mb-2 block">Icon & Color</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-16 h-10 flex items-center justify-center">
                  <IconPickerComponent name={selectedIcon} style={{ color: selectedColor }} className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                 {typeof window !== 'undefined' && TwitterPicker && <TwitterPicker color={selectedColor} onChangeComplete={handleColorChange} triangle="hide" />}
              </PopoverContent>
            </Popover>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Icon" />
              </SelectTrigger>
              <SelectContent>
                {habitIcons.slice(0,50).map(iconName => ( 
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
          <Select value={frequency} onValueChange={setFrequency}>
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
            />
          )}
        </div>
      </div>


      <div>
        <Label className="text-base">Available Times (Optional)</Label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Morning', 'Afternoon', 'Evening', 'Anytime'].map(time => (
            <Button 
              key={time} 
              type="button" 
              variant={availableTimes.includes(time.toLowerCase()) ? "default" : "outline"}
              onClick={() => handleTimeChange(time.toLowerCase())}
              className="w-full"
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="difficulty" className="text-base">Preferred Task Difficulty (Optional)</Label>
        <Select value={difficulty} onValueChange={setDifficulty}>
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
          <Button type="button" variant="outline" size="sm" onClick={fetchAiSuggestion} disabled={isFetchingSuggestion || !goal} className="text-accent border-accent hover:bg-accent/10">
            {isFetchingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Suggest Task
          </Button>
        </div>
        {isFetchingSuggestion && <div className="h-10 w-full animate-pulse rounded-md bg-muted" />}
        {!isFetchingSuggestion && aiSuggestion && (
          <div className="p-3 bg-accent/10 rounded-md">
            <p className="text-sm text-accent-foreground/90">{aiSuggestion}</p>
          </div>
        )}
        {!isFetchingSuggestion && !aiSuggestion && (
          <p className="text-sm text-muted-foreground">Click "Suggest Task" to get an AI-powered micro-task for your goal.</p>
        )}
      </div>


      <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || !goal} size="lg">
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
        Create Habit
      </Button>
    </form>
  );
}

