
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getChallengeById, updateChallenge } from '@/lib/firebase';
import type { Challenge } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Edit3, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const challengeCategories = ["Fitness", "Wellness", "Learning", "Productivity", "Creative", "Social", "Environment", "Other"];

const challengeFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  category: z.string().min(1, "Category is required."),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  dataAiHint: z.string().max(50).optional().refine(val => !val || val.split(' ').length <= 2, { message: "AI Hint can be max 2 words." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialChallengeData, setInitialChallengeData] = useState<Challenge | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      imageUrl: '',
      dataAiHint: '',
    }
  });

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!currentFirebaseUser) {
        toast({ title: "Authentication Required", description: "You must be logged in to edit a challenge.", variant: "destructive" });
        router.push('/auth');
        return;
    }

    if (!challengeId) {
      setError("Challenge ID not found.");
      setIsDataLoading(false);
      return;
    }

    const fetchChallenge = async () => {
      setIsDataLoading(true);
      setError(null);
      try {
        const fetchedChallenge = await getChallengeById(challengeId);
        if (fetchedChallenge) {
          if (fetchedChallenge.creatorId !== currentFirebaseUser.uid) {
            setError("You are not authorized to edit this challenge.");
            toast({ title: "Unauthorized", description: "You can only edit challenges you created.", variant: "destructive" });
            router.push(`/challenges/${challengeId}`);
            setInitialChallengeData(null);
          } else {
            setInitialChallengeData(fetchedChallenge);
            reset({
              title: fetchedChallenge.title,
              description: fetchedChallenge.description,
              startDate: parseISO(fetchedChallenge.startDate),
              endDate: parseISO(fetchedChallenge.endDate),
              category: fetchedChallenge.category || '',
              imageUrl: fetchedChallenge.imageUrl || '',
              dataAiHint: fetchedChallenge.dataAiHint || '',
            });
          }
        } else {
          setError("Challenge not found.");
          setInitialChallengeData(null);
        }
      } catch (err: any) {
        console.error("Error fetching challenge for edit:", err);
        setError(err.message || "Failed to load challenge data.");
        setInitialChallengeData(null);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchChallenge();
  }, [challengeId, router, currentFirebaseUser, isAuthLoading, reset, toast]);


  const onSubmit: SubmitHandler<ChallengeFormValues> = async (data) => {
    if (!currentFirebaseUser?.uid || !challengeId || !initialChallengeData) {
        toast({ title: "Error", description: "Missing data. Cannot update challenge.", variant: "destructive" });
        return;
    }
    if (initialChallengeData.creatorId !== currentFirebaseUser.uid) {
        toast({ title: "Unauthorized", description: "You can only edit challenges you created.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      const dataToUpdate: Partial<Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>> = {
        title: data.title,
        description: data.description,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        category: data.category,
        imageUrl: data.imageUrl, // Pass as is, updateChallenge handles Pexels/placeholder logic
        dataAiHint: data.dataAiHint || data.category.toLowerCase().split(' ').slice(0,2).join(' '),
      };
      
      const updatedChallenge = await updateChallenge(challengeId, dataToUpdate);
      if (updatedChallenge) {
        toast({ title: "Challenge Updated!", description: `"${updatedChallenge.title}" has been successfully updated.` });
        router.push(`/challenges/${challengeId}`);
      } else {
        throw new Error("Update challenge returned undefined.");
      }
    } catch (error: any) {
      console.error("Error updating challenge:", error);
      toast({ title: "Error Updating Challenge", description: error.message || "Could not update challenge.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isDataLoading && !error) { // Show skeleton only if no error yet
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
         <Card className="shadow-xl bg-destructive/10 border-destructive">
           <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center text-destructive">
                    <AlertTriangle className="mr-3 h-7 w-7" />
                    Error Loading Challenge
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/80 mb-6">{error}</p>
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    Back
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!initialChallengeData && !isDataLoading) {
    return (
        <div className="max-w-3xl mx-auto text-center py-10">
             <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center">
                        <AlertTriangle className="mr-3 h-7 w-7 text-muted-foreground" />
                        Challenge Not Found
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">The challenge you are trying to edit does not exist or could not be loaded.</p>
                     <Button variant="outline" onClick={() => router.back()} className="mb-4">
                        Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center">
            <Edit3 className="mr-3 h-7 w-7 text-primary" />
            Edit Challenge: {initialChallengeData?.title}
          </CardTitle>
          <CardDescription>
            Update the details for your challenge. Image URL can be left blank to use Pexels, or provide your own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Challenge Title</Label>
              <Input id="title" {...register("title")} disabled={isSubmitting} className="mt-1" />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} disabled={isSubmitting} className="mt-1" rows={4} />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal mt-1 ${!field.value && "text-muted-foreground"}`}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={isSubmitting || !field.value} // Disable if no value to prevent errors with date-fns
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                 <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal mt-1 ${!field.value && "text-muted-foreground"}`}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={isSubmitting || !field.value} // Disable if no value to prevent errors with date-fns
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.endDate && <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting}>
                        <SelectTrigger id="category" className="mt-1">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {challengeCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input id="imageUrl" {...register("imageUrl")} placeholder="https://example.com/image.png or leave blank" disabled={isSubmitting} className="mt-1" />
              {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Leave blank to use an image from Pexels based on title/hint. Provide a URL to use your own image.</p>
            </div>
             <div>
              <Label htmlFor="dataAiHint">Image Pexels Hint (Optional)</Label>
              <Input id="dataAiHint" {...register("dataAiHint")} placeholder="e.g. 'fitness workout'" disabled={isSubmitting} className="mt-1" />
               <p className="text-xs text-muted-foreground mt-1">One or two keywords to guide Pexels image search if no URL is provided. Max 2 words.</p>
              {errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}
            </div>


            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push(`/challenges/${challengeId}`)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    