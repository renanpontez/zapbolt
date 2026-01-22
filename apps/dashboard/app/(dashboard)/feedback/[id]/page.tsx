'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Globe, Monitor, Calendar, Mail, Loader2 } from 'lucide-react';
import type { FeedbackStatus } from '@zapbolt/shared';

import { useFeedbackItem, useUpdateFeedbackStatus, useUpdateFeedbackNotes } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/feedback/status-badge';
import { ReplyForm } from '@/components/feedback/reply-form';
import { ReplyHistory } from '@/components/feedback/reply-history';
import { formatDateTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusOptions: { value: FeedbackStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export default function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = use(params);
  const { data: feedback, isLoading } = useFeedbackItem(id);
  const updateStatus = useUpdateFeedbackStatus(id);
  const updateNotes = useUpdateFeedbackNotes(id);

  const [notes, setNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  // Initialize notes when feedback loads
  if (feedback && !notesInitialized) {
    setNotes(feedback.internalNotes || '');
    setNotesInitialized(true);
  }

  const handleStatusChange = (status: FeedbackStatus) => {
    updateStatus.mutate(status);
  };

  const handleSaveNotes = () => {
    updateNotes.mutate(notes);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Feedback not found</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/projects/${feedback.projectId}/feedback`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Feedback Details</h2>
            <p className="truncate text-sm text-muted-foreground">
              Submitted {formatDateTime(feedback.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge category={feedback.category} />
          <PriorityBadge priority={feedback.priority} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{feedback.message}</p>
            </CardContent>
          </Card>

          {/* Screenshot */}
          {feedback.screenshotUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setScreenshotOpen(true)}
                >
                  <Image
                    src={feedback.screenshotUrl}
                    alt="Feedback screenshot"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>
                Private notes for your team (not visible to users)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this feedback..."
                rows={4}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={updateNotes.isPending || notes === feedback.internalNotes}
              >
                {updateNotes.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Reply Section */}
          <ReplyForm feedbackId={id} userEmail={feedback.email} />

          {/* Reply History */}
          <ReplyHistory feedbackId={id} userEmail={feedback.email} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={feedback.status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger>
                  <SelectValue>
                    <StatusBadge status={feedback.status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Contact Info */}
          {feedback.email && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${feedback.email}`}
                    className="text-primary hover:underline"
                  >
                    {feedback.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Page URL</p>
                  <a
                    href={feedback.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {new URL(feedback.metadata.url).pathname}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Screen Size</p>
                  <p className="text-muted-foreground">
                    {feedback.metadata.screenWidth} x {feedback.metadata.screenHeight}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Submitted</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(feedback.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Screenshot Lightbox */}
      <Dialog open={screenshotOpen} onOpenChange={setScreenshotOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Screenshot</DialogTitle>
          </DialogHeader>
          {feedback.screenshotUrl && (
            <div className="relative aspect-video">
              <Image
                src={feedback.screenshotUrl}
                alt="Feedback screenshot"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
