'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Globe, Monitor, Calendar, Mail, Loader2, StickyNote, History } from 'lucide-react';
import type { FeedbackStatus } from '@zapbolt/shared';

import { useFeedbackItem, useUpdateFeedbackStatus, useUpdateFeedbackCategory, useUpdateFeedbackPriority, useInternalNotes, useCreateInternalNote, useFeedbackChangeLogs, type InternalNote } from '@/hooks/useFeedback';
import type { FeedbackCategory, FeedbackPriority, FeedbackChangeLog } from '@zapbolt/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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

const categoryOptions: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
];

const priorityOptions: { value: FeedbackPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function InternalNoteItem({ note }: { note: InternalNote }) {
  const authorDisplay = note.author.name || note.author.email;
  const dateDisplay = new Date(note.createdAt).toLocaleString();

  return (
    <div className="border-l-2 border-primary/30 pl-3 py-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className="font-medium text-foreground">{authorDisplay}</span>
        <span>•</span>
        <span>{dateDisplay}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
    </div>
  );
}

function getFieldDisplayName(field: string): string {
  switch (field) {
    case 'status': return 'Status';
    case 'category': return 'Issue Type';
    case 'priority': return 'Priority';
    default: return field;
  }
}

function getValueDisplayName(field: string, value: string): string {
  if (field === 'status') {
    const option = statusOptions.find(o => o.value === value);
    return option?.label || value;
  }
  if (field === 'category') {
    const option = categoryOptions.find(o => o.value === value);
    return option?.label || value;
  }
  if (field === 'priority') {
    const option = priorityOptions.find(o => o.value === value);
    return option?.label || value;
  }
  return value;
}

function ChangeLogItem({ log }: { log: FeedbackChangeLog }) {
  const authorDisplay = log.changedByName || log.changedByEmail;
  const dateDisplay = new Date(log.createdAt).toLocaleString();
  const fieldName = getFieldDisplayName(log.field);
  const oldDisplay = getValueDisplayName(log.field, log.oldValue);
  const newDisplay = getValueDisplayName(log.field, log.newValue);

  return (
    <div className="border-l-2 border-muted pl-3 py-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className="font-medium text-foreground">{authorDisplay}</span>
        <span>•</span>
        <span>{dateDisplay}</span>
      </div>
      <p className="text-sm">
        Changed <span className="font-medium">{fieldName}</span> from{' '}
        <span className="text-muted-foreground line-through">{oldDisplay}</span> to{' '}
        <span className="font-medium">{newDisplay}</span>
      </p>
    </div>
  );
}

export default function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = use(params);
  const { data: feedback, isLoading } = useFeedbackItem(id);
  const { data: notesData } = useInternalNotes(id);
  const { data: changeLogsData } = useFeedbackChangeLogs(id);
  const updateStatus = useUpdateFeedbackStatus(id);
  const updateCategory = useUpdateFeedbackCategory(id);
  const updatePriority = useUpdateFeedbackPriority(id);
  const createNote = useCreateInternalNote(id);

  const [newNote, setNewNote] = useState('');
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  const notes = notesData?.notes || [];
  const changeLogs = changeLogsData?.logs || [];

  const handleStatusChange = useCallback((status: FeedbackStatus) => {
    updateStatus.mutate(status);
  }, [updateStatus]);

  const handleCategoryChange = useCallback((category: FeedbackCategory) => {
    updateCategory.mutate(category);
  }, [updateCategory]);

  const handlePriorityChange = useCallback((priority: FeedbackPriority) => {
    updatePriority.mutate(priority);
  }, [updatePriority]);

  const handleSaveNotes = useCallback(() => {
    if (!newNote.trim()) return;

    createNote.mutate(newNote.trim(), {
      onSuccess: () => {
        setNewNote('');
      },
    });
  }, [newNote, createNote]);

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
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Conversation History */}
          <ReplyHistory
            feedbackId={id}
            userEmail={feedback.email}
            originalMessage={{ message: feedback.message, createdAt: feedback.createdAt }}
          />

          {/* Reply Section */}
          <ReplyForm feedbackId={id} userEmail={feedback.email} />

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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status, Category & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Settings</CardTitle>
              <CardDescription>
                Update the issue type, priority, and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Type</label>
                <Select
                  value={feedback.category}
                  onValueChange={handleCategoryChange}
                  disabled={updateCategory.isPending}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <CategoryBadge category={feedback.category} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={feedback.priority}
                  onValueChange={handlePriorityChange}
                  disabled={updatePriority.isPending}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <PriorityBadge priority={feedback.priority} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
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
              </div>
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

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Internal Notes
              </CardTitle>
              <CardDescription>
                Private notes (not visible to users)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {notes.map((note) => (
                    <InternalNoteItem key={note.id} note={note} />
                  ))}
                </div>
              )}
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="text-sm"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={createNote.isPending || !newNote.trim()}
                size="sm"
                className="w-full"
              >
                {createNote.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Change Log History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                History of changes to this issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeLogs.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {changeLogs.map((log) => (
                    <ChangeLogItem key={log.id} log={log} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No changes recorded yet
                </p>
              )}
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
