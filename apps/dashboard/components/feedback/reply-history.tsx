'use client';

import { MessageSquare, UserCog, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { FeedbackReply } from '@zapbolt/shared';

import { useFeedbackReplies } from '@/hooks/useFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';

interface OriginalMessage {
  message: string;
  createdAt: string;
}

interface ReplyHistoryProps {
  feedbackId: string;
  userEmail: string | null | undefined;
  originalMessage?: OriginalMessage;
}

interface ReplyItemProps {
  reply: FeedbackReply;
  userEmail: string | null | undefined;
}

function AttachmentPreview({ url, isAdmin }: { url: string; isAdmin: boolean }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const fileName = url.split('/').pop() || 'attachment';

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <div className="relative w-48 h-32 rounded-md overflow-hidden border">
          <Image src={url} alt="Attachment" fill className="object-cover" />
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-md text-xs ${
        isAdmin ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-background hover:bg-background/80'
      }`}
    >
      <FileText className="h-4 w-4" />
      <span className="truncate max-w-[150px]">{fileName}</span>
      <Paperclip className="h-3 w-3 ml-auto" />
    </a>
  );
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
          {reply.attachmentUrl && (
            <AttachmentPreview url={reply.attachmentUrl} isAdmin={isAdmin} />
          )}
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

interface OriginalMessageItemProps {
  message: OriginalMessage;
  userEmail: string | null | undefined;
}

function OriginalMessageItem({ message, userEmail }: OriginalMessageItemProps) {
  const displayEmail = userEmail || 'User';
  const initials = displayEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex gap-3 flex-row-reverse"
      role="article"
      aria-label={`Original feedback from ${formatDateTime(message.createdAt)}`}
    >
      <Avatar className="h-8 w-8 shrink-0 bg-muted">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1 text-right">
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm font-medium">{displayEmail}</span>
          <time
            dateTime={message.createdAt}
            className="text-xs text-muted-foreground"
            title={formatDateTime(message.createdAt)}
          >
            {formatRelativeTime(message.createdAt)}
          </time>
        </div>
        <div className="inline-block max-w-[85%] rounded-lg px-4 py-2 text-sm bg-muted rounded-tr-none">
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
      </div>
    </div>
  );
}

export function ReplyHistory({ feedbackId, userEmail, originalMessage }: ReplyHistoryProps) {
  const { data, isLoading, error } = useFeedbackReplies(feedbackId);

  const replies = data?.replies || [];
  const totalMessages = (originalMessage ? 1 : 0) + replies.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation
        </CardTitle>
        <CardDescription>
          {totalMessages > 0
            ? `${totalMessages} ${totalMessages === 1 ? 'message' : 'messages'} in this thread`
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
        ) : (
          <div
            className="space-y-4 max-h-[500px] overflow-y-auto pr-2"
            role="log"
            aria-label="Conversation history"
          >
            {originalMessage && (
              <OriginalMessageItem message={originalMessage} userEmail={userEmail} />
            )}
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} userEmail={userEmail} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
