
'use client'; // Needs to be client component for Tabs and data fetching/mutation

import React, { useEffect, useState } from 'react';
import { CommunityFeed } from "@/components/community/community-feed";
import { ChallengeCard } from "@/components/community/challenge-card";
import { getCommunityPosts, getChallenges } from "@/lib/firebase";
import type { CommunityPost, Challenge } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");


  useEffect(() => {
    async function fetchData() {
      if (activeTab === "feed") {
        setIsLoadingPosts(true);
        try {
          const fetchedPosts = await getCommunityPosts();
          setPosts(fetchedPosts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setIsLoadingPosts(false);
        }
      } else if (activeTab === "challenges") {
        setIsLoadingChallenges(true);
        try {
          const fetchedChallenges = await getChallenges();
          setChallenges(fetchedChallenges);
        } catch (error) {
          console.error("Error fetching challenges:", error);
        } finally {
          setIsLoadingChallenges(false);
        }
      }
    }
    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
      </div>

      <Tabs defaultValue="feed" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <TabsList className="bg-card p-1 rounded-lg shadow w-full sm:w-auto">
            <TabsTrigger value="feed" className="px-4 py-2 text-sm flex-1 sm:flex-none">Activity Feed</TabsTrigger>
            <TabsTrigger value="challenges" className="px-4 py-2 text-sm flex-1 sm:flex-none">Challenges</TabsTrigger>
          </TabsList>
           <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary w-full sm:w-auto">
            {/* Link might need to be dynamic based on tab or a generic create page */}
            <Link href={activeTab === "feed" ? "/community/create-post" : "/challenges/create"}> 
              <PlusCircle className="mr-2 h-4 w-4" /> Create {activeTab === "feed" ? "Post" : "Challenge"}
            </Link>
          </Button>
        </div>
        
        <TabsContent value="feed">
          {isLoadingPosts ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <CommunityFeed initialPosts={posts} />
          )}
        </TabsContent>
        <TabsContent value="challenges">
          {isLoadingChallenges ? (
             <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : challenges.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg shadow">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Challenges Available</h3>
                <p className="text-muted-foreground mb-4">Check back later for new challenges or start your own!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
