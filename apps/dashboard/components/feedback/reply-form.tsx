'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, Mail, MailX, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

import { useSendReply } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReplyFormProps {
  feedbackId: string;
  userEmail: string | null | undefined;
}

const MAX_MESSAGE_LENGTH = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function ReplyForm({ feedbackId, userEmail }: ReplyFormProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const sendReply = useSendReply(feedbackId);

  const hasEmail = Boolean(userEmail);
  const characterCount = message.length;
  const isOverLimit = characterCount > MAX_MESSAGE_LENGTH;
  const isBusy = sendReply.isPending || isUploading;
  const canSend = hasEmail && message.trim().length > 0 && !isOverLimit && !isBusy;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image, PDF, or document file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    const supabase = createClient();

    // Compress images before upload (max 1MB, max 1920px)
    const fileToUpload = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
    });

    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${feedbackId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('reply-attachments')
      .upload(fileName, fileToUpload);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('reply-attachments')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if (!canSend) return;

    try {
      setIsUploading(true);
      let attachmentUrl: string | undefined;

      if (attachment) {
        const url = await uploadAttachment(attachment);
        if (!url) {
          toast({
            title: 'Failed to upload attachment',
            description: 'Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
        attachmentUrl = url;
      }

      setIsUploading(false);
      await sendReply.mutateAsync({ message: message.trim(), attachmentUrl });
      setMessage('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: 'Reply sent',
        description: `Your reply has been sent to ${userEmail}`,
        variant: 'success',
      });
    } catch (error) {
      setIsUploading(false);
      toast({
        title: 'Failed to send reply',
        description: error instanceof Error ? error.message : 'An error occurred while sending your reply',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
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

        {attachment && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            {getFileIcon(attachment.type)}
            <span className="text-sm truncate flex-1">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">
              {(attachment.size / 1024).toFixed(1)} KB
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={removeAttachment}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading...' : 'Sending...'}
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
