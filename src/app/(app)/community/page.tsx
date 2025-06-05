import { CommunityFeed } from "@/components/community/community-feed";
import { ChallengeCard } from "@/components/community/challenge-card";
import { mockPosts, mockChallenges } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function CommunityPage() {
  // In a real app, fetch data
  const posts = mockPosts;
  const challenges = mockChallenges;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
        {/* Add create post/challenge button if needed */}
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-card p-1 rounded-lg shadow">
            <TabsTrigger value="feed" className="px-4 py-2 text-sm">Activity Feed</TabsTrigger>
            <TabsTrigger value="challenges" className="px-4 py-2 text-sm">Challenges</TabsTrigger>
          </TabsList>
          {/* Could be context-dependent based on tab */}
           <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
            <Link href="/community/create-post"> {/* Or /challenges/create */}
              <PlusCircle className="mr-2 h-4 w-4" /> Create Post
            </Link>
          </Button>
        </div>
        
        <TabsContent value="feed">
          <CommunityFeed initialPosts={posts} />
        </TabsContent>
        <TabsContent value="challenges">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
           {challenges.length === 0 && (
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

// Dummy icon for Trophy if not imported
const Trophy = ({className}: {className?:string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;

