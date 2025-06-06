
'use client';

import type { FC } from 'react';
import React, { useState, useCallback } from 'react';
import type { CommunityPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ThumbsUp, MessageSquare, MoreHorizontal, Share2, Trash2, Flag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { likePost as firebaseLikePost, deletePost as firebaseDeletePost } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';


interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onDeletePost?: (postId: string) => void;
}

const PostCardComponent: FC<PostCardProps> = ({ post: initialPost, currentUserId, onDeletePost }) => {
  const [post, setPost] = useState(initialPost);
  const [isLikedByCurrentUser, setIsLikedByCurrentUser] = useState(initialPost.likes.includes(currentUserId));
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(initialPost.likes.length);
  const { toast } = useToast();


  const handleLike = useCallback(async () => {
    const originalIsLiked = isLikedByCurrentUser;
    const originalLikeCount = optimisticLikeCount;

    setIsLikedByCurrentUser(prev => !prev);
    setOptimisticLikeCount(prev => originalIsLiked ? prev - 1 : prev + 1);

    try {
      const updatedPost = await firebaseLikePost(post.id, currentUserId);
      if (updatedPost) {
        setPost(updatedPost); 
        setIsLikedByCurrentUser(updatedPost.likes.includes(currentUserId));
        setOptimisticLikeCount(updatedPost.likes.length);
      } else {
        throw new Error("Failed to update like status.");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLikedByCurrentUser(originalIsLiked);
      setOptimisticLikeCount(originalLikeCount);
      toast({title: "Error", description: "Could not update like.", variant: "destructive"});
    }
  }, [isLikedByCurrentUser, optimisticLikeCount, currentUserId, post.id, toast]);
  
  const handleDelete = async () => {
    if (post.userId !== currentUserId) {
        toast({title: "Unauthorized", description: "You can only delete your own posts.", variant: "destructive"});
        return;
    }
    // Confirmation step:
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
        return;
    }
    try {
        await firebaseDeletePost(post.id); 
        toast({title: "Post Deleted", description: "Your post has been removed."});
        if (onDeletePost) onDeletePost(post.id); 
    } catch (error: any) {
        console.error("Error deleting post:", error);
        toast({title: "Error", description: error.message || "Could not delete post.", variant: "destructive"});
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card className="shadow-md overflow-hidden bg-card">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.userId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.userAvatarUrl} alt={post.userName} data-ai-hint="person avatar"/>
                <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.userId}`} className="font-semibold text-sm hover:underline">{post.userName}</Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => {/* TODO: View post details */}}>View Post Details</DropdownMenuItem>
              {post.userId === currentUserId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => {/* TODO: Report post */}}>
                <Flag className="mr-2 h-4 w-4" /> Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border">
            <Image 
              src={post.imageUrl} 
              alt="Post image" 
              width={500} 
              height={300} 
              className="object-cover w-full"
              data-ai-hint={post.dataAiHint || "social media"}
            />
          </div>
        )}
        {post.habitId && (
             <Link href={`/habits#${post.habitId}`}> 
                <Button variant="link" className="px-0 h-auto text-xs mt-2 text-primary hover:underline">
                    Related Habit
                </Button>
             </Link>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t flex justify-between items-center">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className={`flex items-center gap-1.5 text-muted-foreground hover:text-primary ${isLikedByCurrentUser ? 'text-primary' : ''}`}>
            <ThumbsUp className={`h-4 w-4 ${isLikedByCurrentUser ? 'fill-primary' : ''}`} /> 
            <span>{optimisticLikeCount} {optimisticLikeCount === 1 ? 'Like' : 'Likes'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
            <MessageSquare className="h-4 w-4" /> 
            <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
          <Share2 className="h-4 w-4" /> 
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
export const PostCard = React.memo(PostCardComponent);
PostCard.displayName = 'PostCard';
