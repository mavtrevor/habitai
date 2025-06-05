'use client';

import type { CommunityPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ThumbsUp, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { likePost as mockLikePost } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
}

export function PostCard({ post: initialPost, currentUserId }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    // const updatedPost = await mockLikePost(post.id, currentUserId); // Mock
    // if (updatedPost) {
    //   setPost(updatedPost);
    //   setIsLiked(updatedPost.likes.includes(currentUserId));
    //   setLikeCount(updatedPost.likes.length);
    // }
    // Mock behavior:
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card className="shadow-md overflow-hidden bg-card">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.userId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.userAvatarUrl} alt={post.userName} data-ai-hint="person avatar" />
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
              <DropdownMenuItem>View Post</DropdownMenuItem>
              {post.userId === currentUserId && <DropdownMenuItem className="text-destructive">Delete Post</DropdownMenuItem>}
              <DropdownMenuItem>Report Post</DropdownMenuItem>
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
          <Button variant="ghost" size="sm" onClick={handleLike} className={`flex items-center gap-1.5 text-muted-foreground hover:text-primary ${isLiked ? 'text-primary' : ''}`}>
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} /> 
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
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
