
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addChallenge, getCurrentUser } from '@/lib/firebase';
import type { Challenge } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, PlusCircle, Trophy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

const challengeCategories = ["Fitness", "Wellness", "Learning", "Productivity", "Creative", "Social", "Environment", "Other"];

const challengeFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  category: z.string().min(1, "Category is required."),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  dataAiHint: z.string().max(50).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

export default function CreateChallengePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    const fetchUser = async () => {
      setIsAuthLoading(true);
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        toast({ title: "Authentication Required", description: "You must be logged in to create a challenge.", variant: "destructive" });
        router.push('/auth');
      }
      setIsAuthLoading(false);
    };
    fetchUser();
  }, [router, toast]);

  const onSubmit: SubmitHandler<ChallengeFormValues> = async (data) => {
    if (!currentUserId) {
        toast({ title: "Error", description: "User not identified. Cannot create challenge.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const challengeData: Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview'> = {
        title: data.title,
        description: data.description,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        category: data.category,
        imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.title)}`,
        dataAiHint: data.dataAiHint || data.category.toLowerCase(),
      };
      await addChallenge(challengeData);
      toast({ title: "Challenge Created!", description: `"${data.title}" is now live.` });
      reset();
      router.push('/challenges');
    } catch (error: any) {
      toast({ title: "Error Creating Challenge", description: error.message || "Could not create challenge.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center">
            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
            Create New Challenge
          </CardTitle>
          <CardDescription>
            Inspire the community by setting up a new challenge for everyone to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Challenge Title</Label>
              <Input id="title" {...register("title")} disabled={isLoading} className="mt-1" />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} disabled={isLoading} className="mt-1" rows={4} />
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
              <Input id="imageUrl" {...register("imageUrl")} placeholder="https://example.com/image.png" disabled={isLoading} className="mt-1" />
              {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">If left blank, a placeholder will be generated.</p>
            </div>
             <div>
              <Label htmlFor="dataAiHint">Image AI Hint (Optional)</Label>
              <Input id="dataAiHint" {...register("dataAiHint")} placeholder="e.g. 'fitness workout' or 'nature meditation'" disabled={isLoading} className="mt-1" />
               <p className="text-xs text-muted-foreground mt-1">One or two keywords for AI image generation if a custom URL is not provided. Max 2 words.</p>
              {errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}
            </div>


            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isLoading ? "Creating..." : "Create Challenge"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
