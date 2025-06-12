
'use client';

import type { FC } from 'react';
import React from 'react';
import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export const CommentItem: FC<CommentItemProps> = React.memo(({ comment, currentUserId, onDeleteComment }) => {
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDeleteComment(comment.id);
    }
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-border/50 last:border-b-0">
      <Link href={`/profile/${comment.userId}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} data-ai-hint="person avatar" />
          <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <div>
                <Link href={`/profile/${comment.userId}`} className="text-sm font-semibold hover:underline">
                    {comment.userName}
                </Link>
                <span className="text-xs text-muted-foreground ml-2">{timeAgo}</span>
            </div>
          {comment.userId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';
