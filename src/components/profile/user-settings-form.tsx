
'use client';

import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { updateUserProfile, linkEmailAndPasswordToCurrentUser } from '@/lib/firebase';
import { getAuth, type User as FirebaseAuthUser } from '@/lib/firebase/client';
import { Separator } from '../ui/separator';

interface UserSettingsFormProps {
  user: UserProfile; // Initial user data passed as prop
}

const timezones = [
  "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Australia/Sydney",
  "America/Chicago", "Europe/Paris", "Asia/Dubai", "Pacific/Auckland"
];

const goalCategories = ["Fitness", "Productivity", "Wellness", "Learning", "Finance", "Creativity", "Mindfulness", "Social"];

export function UserSettingsForm({ user: initialUser }: UserSettingsFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [timezone, setTimezone] = useState(initialUser.timezone || '');
  const [preferredTimes, setPreferredTimes] = useState<string[]>(initialUser.preferences?.preferredTimes || []);
  const [selectedGoalCategories, setSelectedGoalCategories] = useState<string[]>(initialUser.preferences?.goalCategories || []);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // firebaseAuthUser is kept for potential other uses, though not strictly necessary for form visibility logic anymore
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseAuthUser | null>(null); 
  const [showAddPasswordForm, setShowAddPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    setName(initialUser.name);
    setEmail(initialUser.email);
    setTimezone(initialUser.timezone || '');
    setPreferredTimes(initialUser.preferences?.preferredTimes || []);
    setSelectedGoalCategories(initialUser.preferences?.goalCategories || []);
  }, [initialUser]);

  // Combined useEffect to handle auth state and determine "Add Password" form visibility
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseAuthUser(user); // Set the auth user state

      if (user) {
        const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
        const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
        setShowAddPasswordForm(hasGoogleProvider && !hasPasswordProvider);
      } else {
        setShowAddPasswordForm(false);
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount


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

    const authInstance = getAuth();
    const currentAuthUser = authInstance.currentUser;
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
      },
      lastUpdatedAt: new Date().toISOString(),
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

  const handleAddPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Password Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }

    setIsSettingPassword(true);
    const auth = getAuth();
    try {
      await linkEmailAndPasswordToCurrentUser(newPassword);
      toast({ title: 'Password Added', description: 'You can now sign in with your email and this password.' });
      setNewPassword('');
      setConfirmNewPassword('');
      
      // After successfully adding password, Firebase Auth state will change,
      // and the onAuthStateChanged listener will update `showAddPasswordForm` to false.
      // Explicitly reloading the user here ensures the providerData is immediately fresh for that listener.
      if (auth.currentUser) {
        await auth.currentUser.reload();
        // The onAuthStateChanged listener will pick up the change from reload and update UI.
      }
    } catch (error: any) {
      toast({ title: 'Error Adding Password', description: error.message || 'Could not add password.', variant: 'destructive' });
    } finally {
      setIsSettingPassword(false);
    }
  };


  return (
    <div className="space-y-8">
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
          <Button type="submit" disabled={isLoading || isSettingPassword} className="min-w-[120px]">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </form>

      {showAddPasswordForm && firebaseAuthUser && (
        <>
          <Separator className="my-8" />
          <form onSubmit={handleAddPassword} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center mb-1">
                <KeyRound className="mr-2 h-5 w-5 text-primary" />
                Set Up Email/Password Sign-In
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You currently sign in with Google. Add a password to also sign in with your email ({firebaseAuthUser.email}).
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  disabled={isSettingPassword}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showNewPassword ? "Hide" : "Show"} password</span>
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
               <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  disabled={isSettingPassword}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  tabIndex={-1}
                >
                  {showConfirmNewPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showConfirmNewPassword ? "Hide" : "Show"} password</span>
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSettingPassword || isLoading} className="min-w-[150px]">
                {isSettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSettingPassword ? 'Saving Password...' : 'Save Password'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

