
'use client';

import type { FC } from 'react';
import React, { useState, FormEvent, useCallback } from 'react';
import type { CommunityPost } from '@/types';
import { PostCard } from './post-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCurrentUser, addCommunityPost } from '@/lib/firebase'; 
import { Paperclip, Send, Image as ImageIcon, Users2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunityFeedProps {
  initialPosts: CommunityPost[]; // Can still receive initial posts from server component if needed
}

export const CommunityFeed: FC<CommunityFeedProps> = React.memo(({ initialPosts }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState<{id: string, name: string, avatarUrl?: string} | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchUser = async () => {
        const user = await getCurrentUser();
        if (user) {
            setCurrentUserDetails({id: user.id, name: user.name, avatarUrl: user.avatarUrl});
        }
    };
    fetchUser();
  }, []);

  const handleCreatePost = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!newPostContent.trim() || !currentUserDetails) return;

    setIsPosting(true);
    try {
      // addCommunityPost now handles userId, userName, userAvatarUrl internally
      const createdPost = await addCommunityPost({
        content: newPostContent,
        // habitId and imageUrl can be added here if form supports them
      });
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      setNewPostContent('');
      toast({ title: "Post Created!", description: "Your post is now live on the feed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create post.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  }, [newPostContent, currentUserDetails, toast]);

  if (!currentUserDetails) {
      return (
          <div className="flex justify-center items-center p-6 bg-card rounded-lg shadow-md">
              <Loader2 className="h-6 w-6 animate-spin mr-2"/>
              <p className="text-muted-foreground">Loading your details...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleCreatePost} className="bg-card p-4 rounded-lg shadow-md space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={currentUserDetails.avatarUrl} alt={currentUserDetails.name} data-ai-hint="person avatar" />
            <AvatarFallback>{currentUserDetails.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUserDetails.name}? Share your progress or ask a question!`}
            className="flex-1 min-h-[80px] focus-visible:ring-primary"
            rows={3}
            disabled={isPosting}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={isPosting}>
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Add image (not implemented)</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={isPosting}>
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Add attachment (not implemented)</span>
            </Button>
          </div>
          <Button type="submit" disabled={isPosting || !newPostContent.trim()} className="bg-primary hover:bg-primary/90">
            {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserDetails.id} />
      ))}
      {posts.length === 0 && !isPosting && (
        <div className="text-center py-10">
            <Users2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
});
CommunityFeed.displayName = 'CommunityFeed';
