import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { checkProjectMembership } from '@/lib/supabase/membership';
import { z } from 'zod';

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
});

// GET /api/feedback/[id]/notes - Get all internal notes for a feedback
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Get feedback to check membership
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!feedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const feedback = feedbackData as { id: string; project_id: string };

    // Verify membership
    const membership = await checkProjectMembership(user.id, feedback.project_id);
    if (!membership.isMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    // Get all notes with user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notesData, error: notesError } = await (supabase as any)
      .from('internal_notes')
      .select(`
        id,
        content,
        created_at,
        users (
          id,
          name,
          email
        )
      `)
      .eq('feedback_id', id)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.error('Failed to fetch notes:', notesError);
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch notes' } },
        { status: 500 }
      );
    }

    const notes = (notesData || []).map((note: {
      id: string;
      content: string;
      created_at: string;
      users: { id: string; name: string | null; email: string } | null;
    }) => ({
      id: note.id,
      content: note.content,
      createdAt: note.created_at,
      author: {
        id: note.users?.id || '',
        name: note.users?.name || null,
        email: note.users?.email || '',
      },
    }));

    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/feedback/[id]/notes - Create a new internal note
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = createNoteSchema.parse(body);

    const supabase = await createServerClient();

    // Get feedback to check membership
    const { data: postFeedbackData } = await supabase
      .from('feedback')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!postFeedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const postFeedback = postFeedbackData as { id: string; project_id: string };

    // Verify membership (any member can add notes)
    const membership = await checkProjectMembership(user.id, postFeedback.project_id);
    if (!membership.isMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    // Get user profile for the response
    const { data: userProfileData } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    const userProfile = userProfileData as { id: string; name: string | null; email: string } | null;

    // Insert the note
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: noteData, error: insertError } = await (supabase as any)
      .from('internal_notes')
      .insert({
        feedback_id: id,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (insertError || !noteData) {
      console.error('Failed to create note:', insertError);
      return NextResponse.json(
        { error: { code: 'INSERT_FAILED', message: 'Failed to create note' } },
        { status: 500 }
      );
    }

    const note = noteData as { id: string; content: string; created_at: string };

    return NextResponse.json({
      id: note.id,
      content: note.content,
      createdAt: note.created_at,
      author: {
        id: userProfile?.id || user.id,
        name: userProfile?.name || null,
        email: userProfile?.email || user.email || '',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
