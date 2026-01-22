'use client';

import { MessageSquare, User, UserCog } from 'lucide-react';
import type { FeedbackReply } from '@zapbolt/shared';

import { useFeedbackReplies } from '@/hooks/useFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';

interface ReplyHistoryProps {
  feedbackId: string;
  userEmail: string | null | undefined;
}

interface ReplyItemProps {
  reply: FeedbackReply;
  userEmail: string | null | undefined;
}

function ReplyItem({ reply, userEmail }: ReplyItemProps) {
  const isAdmin = reply.sentBy === 'admin';
  const displayEmail = isAdmin ? reply.sentByEmail : userEmail || 'User';
  const initials = displayEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}
      role="article"
      aria-label={`${isAdmin ? 'Admin' : 'User'} reply from ${formatDateTime(reply.createdAt)}`}
    >
      <Avatar className={`h-8 w-8 shrink-0 ${isAdmin ? 'bg-primary' : 'bg-muted'}`}>
        <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground text-xs' : 'bg-muted text-muted-foreground text-xs'}>
          {isAdmin ? <UserCog className="h-4 w-4" /> : initials}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 space-y-1 ${isAdmin ? '' : 'text-right'}`}>
        <div className={`flex items-center gap-2 ${isAdmin ? '' : 'justify-end'}`}>
          <span className="text-sm font-medium">
            {isAdmin ? 'You' : displayEmail}
          </span>
          <time
            dateTime={reply.createdAt}
            className="text-xs text-muted-foreground"
            title={formatDateTime(reply.createdAt)}
          >
            {formatRelativeTime(reply.createdAt)}
          </time>
        </div>
        <div
          className={`inline-block max-w-[85%] rounded-lg px-4 py-2 text-sm ${
            isAdmin
              ? 'bg-primary text-primary-foreground rounded-tl-none'
              : 'bg-muted rounded-tr-none'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{reply.message}</p>
        </div>
      </div>
    </div>
  );
}

function ReplyHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyReplyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">
        No replies yet. Start a conversation by sending a reply above.
      </p>
    </div>
  );
}

export function ReplyHistory({ feedbackId, userEmail }: ReplyHistoryProps) {
  const { data, isLoading, error } = useFeedbackReplies(feedbackId);

  const replies = data?.replies || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation History
        </CardTitle>
        <CardDescription>
          {replies.length > 0
            ? `${replies.length} ${replies.length === 1 ? 'message' : 'messages'} in this thread`
            : 'Email conversation with the user'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ReplyHistorySkeleton />
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">
              Failed to load conversation history. Please try again.
            </p>
          </div>
        ) : replies.length === 0 ? (
          <EmptyReplyHistory />
        ) : (
          <div
            className="space-y-4 max-h-96 overflow-y-auto pr-2"
            role="log"
            aria-label="Conversation history"
          >
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} userEmail={userEmail} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
