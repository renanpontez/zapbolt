'use client';

import { useState } from 'react';
import { Send, Loader2, Mail, MailX } from 'lucide-react';

import { useSendReply } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReplyFormProps {
  feedbackId: string;
  userEmail: string | null | undefined;
}

const MAX_MESSAGE_LENGTH = 5000;

export function ReplyForm({ feedbackId, userEmail }: ReplyFormProps) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const sendReply = useSendReply(feedbackId);

  const hasEmail = Boolean(userEmail);
  const characterCount = message.length;
  const isOverLimit = characterCount > MAX_MESSAGE_LENGTH;
  const canSend = hasEmail && message.trim().length > 0 && !isOverLimit && !sendReply.isPending;

  const handleSend = async () => {
    if (!canSend) return;

    try {
      await sendReply.mutateAsync(message.trim());
      setMessage('');
      toast({
        title: 'Reply sent',
        description: `Your reply has been sent to ${userEmail}`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Failed to send reply',
        description: error instanceof Error ? error.message : 'An error occurred while sending your reply',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!hasEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailX className="h-5 w-5 text-muted-foreground" />
            Reply to User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground">
            <MailX className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              This user did not provide an email address. You cannot send them a reply.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Reply to User
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Replying to:</span>
          <a
            href={`mailto:${userEmail}`}
            className="text-primary hover:underline font-medium"
          >
            {userEmail}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reply-message" className="sr-only">
            Reply message
          </Label>
          <div className="relative">
            <Textarea
              id="reply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              rows={5}
              className="resize-none pr-20"
              disabled={sendReply.isPending}
              aria-describedby="character-count"
            />
            <div
              id="character-count"
              className={`absolute bottom-2 right-2 text-xs ${
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {characterCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
            </div>
          </div>
          {isOverLimit && (
            <p className="text-xs text-destructive">
              Message exceeds the maximum length of {MAX_MESSAGE_LENGTH.toLocaleString()} characters
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Cmd</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> to send
          </p>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="gap-2"
          >
            {sendReply.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reply
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
