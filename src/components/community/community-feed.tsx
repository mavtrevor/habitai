
'use client';

import type { FC } from 'react';
import React, { useState, FormEvent, useCallback } from 'react';
import type { CommunityPost } from '@/types';
import { PostCard } from './post-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/mock-data'; 
import { addCommunityPost as mockAddCommunityPost } from '@/lib/firebase'; 
import { Paperclip, Send, Image as ImageIcon, Users2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunityFeedProps {
  initialPosts: CommunityPost[];
}

export const CommunityFeed: FC<CommunityFeedProps> = ({ initialPosts }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const currentUser = mockUser; 

  const handleCreatePost = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!newPostContent.trim()) return;

    setIsLoading(true);
    try {
      const createdPost = await mockAddCommunityPost({
        userId: currentUser.id,
        content: newPostContent,
      });
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      setNewPostContent('');
      toast({ title: "Post Created!", description: "Your post is now live on the feed." });
    } catch (error) {
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [newPostContent, currentUser.id, toast]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleCreatePost} className="bg-card p-4 rounded-lg shadow-md space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="person avatar" />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser.name}? Share your progress or ask a question!`}
            className="flex-1 min-h-[80px] focus-visible:ring-primary"
            rows={3}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Add image</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Add attachment</span>
            </Button>
          </div>
          <Button type="submit" disabled={isLoading || !newPostContent.trim()} className="bg-primary hover:bg-primary/90">
            {isLoading ? 'Posting...' : <><Send className="h-4 w-4 mr-2"/>Post</>}
          </Button>
        </div>
      </form>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUser.id} />
      ))}
      {posts.length === 0 && (
        <div className="text-center py-10">
            <Users2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
