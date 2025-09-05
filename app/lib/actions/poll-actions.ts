"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPollSchema, voteSchema, updatePollSchema } from "@/lib/validations/poll";
import { rateLimit } from "@/lib/rate-limit";

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
    const supabase = await createClient();

    // Extract form data for validation
    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = createPollSchema.parse({
      question,
      options,
    });

    // Authenticate user and verify they have permission to create polls
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return { error: userError.message };
    }
    if (!user) {
      return { error: "You must be logged in to create a poll." };
    }

    // Insert new poll into database with user ownership
    const { error } = await supabase.from("polls").insert([
      {
        user_id: user.id,                    // Associate poll with creating user
        question: validatedData.question,    // Sanitized question text
        options: validatedData.options,      // Validated options array
      },
    ]);

    if (error) {
      return { error: error.message };
    }

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
  const supabase = await createClient();
  
  // Authenticate user and verify they have permission to view their polls
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch user's polls ordered by creation date (newest first)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)                    // Only fetch polls owned by this user
    .order("created_at", { ascending: false }); // Newest polls first

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
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
    const supabase = await createClient();
    
    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = voteSchema.parse({
      pollId,
      optionIndex,
    });

    // Get current user (may be null for anonymous voting)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Apply rate limiting to prevent spam voting
    // 5 votes per minute per user (or per poll for anonymous users)
    const rateLimitKey = user ? `vote:${user.id}` : `vote:anonymous:${pollId}`;
    const rateLimitResult = rateLimit(rateLimitKey, 5, 60000);
    
    if (!rateLimitResult.success) {
      return { error: "Too many votes. Please wait before voting again." };
    }

    // Check if authenticated user has already voted on this poll
    if (user) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", validatedData.pollId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        return { error: "You have already voted on this poll." };
      }
    }

    // Verify poll exists and get options to validate option index
    const { data: poll } = await supabase
      .from("polls")
      .select("options")
      .eq("id", validatedData.pollId)
      .single();

    if (!poll) {
      return { error: "Poll not found." };
    }

    // Validate that the selected option index is within bounds
    if (validatedData.optionIndex >= poll.options.length) {
      return { error: "Invalid option selected." };
    }

    // Insert vote record into database
    const { error } = await supabase.from("votes").insert([
      {
        poll_id: validatedData.pollId,        // Poll being voted on
        user_id: user?.id ?? null,           // User ID (null for anonymous votes)
        option_index: validatedData.optionIndex, // Selected option index
      },
    ]);

    if (error) return { error: error.message };
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
