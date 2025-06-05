
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Loader2 } from 'lucide-react';
import { updateUserProfile } from '@/lib/firebase'; // Use real Firebase function
import { auth } from '@/lib/firebase/client'; // For current user ID

interface UserSettingsFormProps {
  user: UserProfile; // Initial user data passed as prop
}

const timezones = [
  "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Australia/Sydney",
  "America/Chicago", "Europe/Paris", "Asia/Dubai", "Pacific/Auckland"
  // Add more common timezones or consider a library for a comprehensive list
];

const goalCategories = ["Fitness", "Productivity", "Wellness", "Learning", "Finance", "Creativity", "Mindfulness", "Social"];

export function UserSettingsForm({ user: initialUser }: UserSettingsFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email); // Display only, not editable here
  const [timezone, setTimezone] = useState(initialUser.timezone || '');
  const [preferredTimes, setPreferredTimes] = useState<string[]>(initialUser.preferences?.preferredTimes || []);
  const [selectedGoalCategories, setSelectedGoalCategories] = useState<string[]>(initialUser.preferences?.goalCategories || []);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Effect to update form if initialUser prop changes (e.g. parent re-fetches)
  useEffect(() => {
    setName(initialUser.name);
    setEmail(initialUser.email);
    setTimezone(initialUser.timezone || '');
    setPreferredTimes(initialUser.preferences?.preferredTimes || []);
    setSelectedGoalCategories(initialUser.preferences?.goalCategories || []);
  }, [initialUser]);


  const handlePreferredTimeChange = (time: string) => {
    setPreferredTimes(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const handleGoalCategoryChange = (category: string) => {
    setSelectedGoalCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser || currentAuthUser.uid !== initialUser.id) {
        toast({ title: 'Authentication Error', description: 'Could not verify user. Please re-login.', variant: 'destructive'});
        setIsLoading(false);
        return;
    }

    const updatedProfileData: Partial<UserProfile> = {
      name,
      timezone,
      preferences: {
        preferredTimes,
        goalCategories: selectedGoalCategories,
      }
    };
    
    try {
      await updateUserProfile(initialUser.id, updatedProfileData);
      toast({ title: 'Profile Updated', description: 'Your settings have been saved.' });
    } catch (error: any) {
      toast({ title: 'Update Error', description: error.message || "Could not update profile.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" disabled={isLoading} />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" value={email} disabled className="mt-1 bg-muted/50 cursor-not-allowed" title="Email cannot be changed here." />
           <p className="text-xs text-muted-foreground mt-1">Email is managed via your authentication provider.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone} disabled={isLoading}>
          <SelectTrigger id="timezone" className="mt-1">
            <SelectValue placeholder="Select your timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map(tz => (
              <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
            ))}
             <SelectItem value="other">Other (Not specified)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="mb-2 block">Preferred Times for Tasks</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Morning', 'Afternoon', 'Evening', 'Anytime'].map(time => (
             <div key={time} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-secondary/50 transition-colors">
                <Checkbox
                    id={`time-${time.toLowerCase()}`}
                    checked={preferredTimes.includes(time.toLowerCase())}
                    onCheckedChange={() => handlePreferredTimeChange(time.toLowerCase())}
                    disabled={isLoading}
                />
                <Label htmlFor={`time-${time.toLowerCase()}`} className="text-sm font-normal cursor-pointer flex-1">{time}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Favorite Goal Categories</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {goalCategories.map(category => (
                <div key={category} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-secondary/50 transition-colors">
                    <Checkbox
                        id={`category-${category.toLowerCase()}`}
                        checked={selectedGoalCategories.includes(category)}
                        onCheckedChange={() => handleGoalCategoryChange(category)}
                        disabled={isLoading}
                    />
                    <Label htmlFor={`category-${category.toLowerCase()}`} className="text-sm font-normal cursor-pointer flex-1">{category}</Label>
                </div>
            ))}
        </div>
      </div>


      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
