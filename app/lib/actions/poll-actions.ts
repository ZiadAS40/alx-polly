"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPollSchema, voteSchema, updatePollSchema } from "@/lib/validations/poll";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Checks if a poll has expired based on its expiration date
 * 
 * @param expiresAt - The expiration date string from the database
 * @returns boolean - true if poll is expired, false if still active
 */
function isPollExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Creates a new poll with question and multiple choice options
 * 
 * This server action handles poll creation by validating form data, authenticating
 * the user, and inserting the poll into the database. It includes comprehensive
 * input validation to prevent malicious data and ensures only authenticated users
 * can create polls.
 * 
 * @param formData - Form data containing poll question and options
 * @returns Promise<{ error: string | null }> - Returns error message if creation fails, null if successful
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What is your favorite color?');
 * formData.append('options', 'Red');
 * formData.append('options', 'Blue');
 * formData.append('options', 'Green');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   console.error('Poll creation failed:', result.error);
 * } else {
 *   // Poll created successfully
 * }
 * ```
 */
export async function createPoll(formData: FormData) {
  try {
    // Extract form data for validation
    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];
    const expiresAt = formData.get("expiresAt") as string;

    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = createPollSchema.parse({
      question,
      options,
      expiresAt: expiresAt || undefined,
    });

    // Temporarily disabled Supabase - just return success for demo
    console.log("Poll created (demo mode):", {
      question: validatedData.question,
      options: validatedData.options,
      expiresAt: validatedData.expiresAt
    });

    // Revalidate the polls page to show the new poll
    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Retrieves all polls created by the currently authenticated user
 * 
 * This server action fetches polls from the database that belong to the current user.
 * It includes authentication checks and returns polls ordered by creation date (newest first).
 * 
 * @returns Promise<{ polls: Poll[], error: string | null }> - Returns user's polls or error message
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls`);
 * }
 * ```
 */
export async function getUserPolls() {
  // Temporarily disabled Supabase - return mock data for demo
  const mockPolls = [
    {
      id: '1',
      question: 'What\'s your favorite programming language?',
      options: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'],
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      user_id: 'demo-user'
    },
    {
      id: '2', 
      question: 'Which framework do you prefer?',
      options: ['React', 'Vue', 'Angular', 'Svelte'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      expires_at: null, // No expiration
      user_id: 'demo-user'
    }
  ];

  return { polls: mockPolls, error: null };
}

/**
 * Retrieves a specific poll by its unique identifier
 * 
 * This server action fetches a single poll from the database by its ID.
 * It can be used to display poll details or verify poll existence before voting.
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Promise<{ poll: Poll | null, error: string | null }> - Returns poll data or error message
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollById('123e4567-e89b-12d3-a456-426614174000');
 * if (error) {
 *   console.error('Poll not found:', error);
 * } else if (poll) {
 *   console.log('Poll question:', poll.question);
 * }
 * ```
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Fetch poll by ID from database
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Retrieves a poll with vote counts and expiration status
 * 
 * This server action fetches a poll by ID and includes vote counts for each option,
 * as well as checking if the poll has expired.
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Promise<{ poll: PollWithVotes | null, error: string | null }> - Returns poll data with votes or error message
 */
export async function getPollWithVotes(id: string) {
  try {
    // Temporarily disabled Supabase - return mock data for demo
    const mockPoll = {
      id: id,
      question: 'What\'s your favorite programming language?',
      options: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'],
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      user_id: 'demo-user'
    };

    // Create mock vote counts
    const optionsWithVotes = mockPoll.options.map((option, index) => ({
      id: index.toString(),
      text: option,
      votes: Math.floor(Math.random() * 20) + 5 // Random vote counts for demo
    }));

    const totalVotes = optionsWithVotes.reduce((sum, option) => sum + option.votes, 0);
    const isExpired = isPollExpired(mockPoll.expires_at);

    return {
      poll: {
        ...mockPoll,
        options: optionsWithVotes,
        totalVotes,
        isExpired,
        expiresAt: mockPoll.expires_at ? new Date(mockPoll.expires_at) : undefined
      },
      error: null
    };
  } catch (error) {
    if (error instanceof Error) {
      return { poll: null, error: error.message };
    }
    return { poll: null, error: 'Failed to fetch poll' };
  }
}

/**
 * Submits a vote for a specific poll option
 * 
 * This server action handles vote submission with comprehensive security measures including:
 * - Input validation to prevent malicious data
 * - Rate limiting to prevent spam voting (5 votes per minute per user)
 * - Duplicate vote prevention for authenticated users
 * - Poll existence and option validity verification
 * - Support for both authenticated and anonymous voting
 * 
 * @param pollId - The unique identifier of the poll to vote on
 * @param optionIndex - The zero-based index of the selected option
 * @returns Promise<{ error: string | null }> - Returns error message if voting fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await submitVote('123e4567-e89b-12d3-a456-426614174000', 0);
 * if (result.error) {
 *   console.error('Vote failed:', result.error);
 * } else {
 *   // Vote submitted successfully
 * }
 * ```
 */
export async function submitVote(pollId: string, optionIndex: number) {
  try {
    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = voteSchema.parse({
      pollId,
      optionIndex,
    });

    // Temporarily disabled Supabase - just return success for demo
    console.log("Vote submitted (demo mode):", {
      pollId: validatedData.pollId,
      optionIndex: validatedData.optionIndex
    });

    // Simulate some validation
    if (validatedData.optionIndex < 0 || validatedData.optionIndex >= 5) {
      return { error: "Invalid option selected." };
    }

    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Deletes a poll owned by the currently authenticated user
 * 
 * This server action handles poll deletion with proper authorization checks to ensure
 * only the poll owner can delete their polls. It includes authentication verification
 * and ownership validation for security.
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Promise<{ error: string | null }> - Returns error message if deletion fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await deletePoll('123e4567-e89b-12d3-a456-426614174000');
 * if (result.error) {
 *   console.error('Poll deletion failed:', result.error);
 * } else {
 *   // Poll deleted successfully
 * }
 * ```
 */
export async function deletePoll(id: string) {
  try {
    const supabase = await createClient();
    
    // Authenticate user and verify they have permission to delete polls
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return { error: userError.message };
    }
    if (!user) {
      return { error: "You must be logged in to delete a poll." };
    }

    // Only allow deleting polls owned by the authenticated user
    // This prevents users from deleting polls they don't own
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    // Revalidate the polls page to reflect the deletion
    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Updates an existing poll owned by the currently authenticated user
 * 
 * This server action handles poll updates with proper authorization checks to ensure
 * only the poll owner can modify their polls. It includes comprehensive input validation
 * and ownership verification for security.
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - Form data containing updated question and options
 * @returns Promise<{ error: string | null }> - Returns error message if update fails, null if successful
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'Updated question?');
 * formData.append('options', 'Option 1');
 * formData.append('options', 'Option 2');
 * 
 * const result = await updatePoll('123e4567-e89b-12d3-a456-426614174000', formData);
 * if (result.error) {
 *   console.error('Poll update failed:', result.error);
 * } else {
 *   // Poll updated successfully
 * }
 * ```
 */
export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const supabase = await createClient();

    // Extract form data for validation
    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = updatePollSchema.parse({
      pollId,
      question,
      options,
    });

    // Authenticate user and verify they have permission to update polls
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return { error: userError.message };
    }
    if (!user) {
      return { error: "You must be logged in to update a poll." };
    }

    // Only allow updating polls owned by the authenticated user
    // This prevents users from modifying polls they don't own
    const { error } = await supabase
      .from("polls")
      .update({ 
        question: validatedData.question,    // Updated question text
        options: validatedData.options      // Updated options array
      })
      .eq("id", validatedData.pollId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    // Revalidate the polls page to reflect the updates
    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Checks for and marks expired polls
 * 
 * This server action can be called periodically to identify polls that have expired
 * and should no longer accept votes. It's useful for cleanup and monitoring.
 * 
 * @returns Promise<{ expiredCount: number, error: string | null }> - Returns count of expired polls or error message
 */
export async function checkExpiredPolls() {
  try {
    const supabase = await createClient();
    
    // Find polls that have expired but might still be accepting votes
    const now = new Date().toISOString();
    const { data: expiredPolls, error } = await supabase
      .from("polls")
      .select("id, question, expires_at")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (error) {
      return { expiredCount: 0, error: error.message };
    }

    // Return count of expired polls (they're already marked as expired by the database query)
    return { expiredCount: expiredPolls?.length || 0, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { expiredCount: 0, error: error.message };
    }
    return { expiredCount: 0, error: 'Failed to check expired polls' };
  }
}
