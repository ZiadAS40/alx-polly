"use client";

import { createClient } from "@/lib/supabase/client";
import { voteSchema } from "@/lib/validations/poll";
import { PollOptionWithVotes, PollResults } from "@/app/lib/types";

/**
 * Client-side function to cast a vote on an existing poll
 * 
 * This function handles vote submission from the client side with proper validation
 * and error handling. It uses the Supabase client for direct database operations
 * and includes comprehensive input validation to prevent malicious data.
 * 
 * @param pollId - The unique identifier of the poll to vote on
 * @param optionIndex - The zero-based index of the selected option
 * @returns Promise<{ success: boolean, error: string | null }> - Returns success status and error message
 * 
 * @example
 * ```typescript
 * const { success, error } = await castVote('123e4567-e89b-12d3-a456-426614174000', 0);
 * if (success) {
 *   console.log('Vote cast successfully');
 * } else {
 *   console.error('Vote failed:', error);
 * }
 * ```
 */
export async function castVote(pollId: string, optionIndex: number): Promise<{ success: boolean, error: string | null }> {
  try {
    // Validate input data using Zod schema
    const validatedData = voteSchema.parse({
      pollId,
      optionIndex,
    });

    const supabase = createClient();

    // Check if poll exists and is not expired
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, options, expires_at")
      .eq("id", validatedData.pollId)
      .single();

    if (pollError) {
      return { success: false, error: "Poll not found" };
    }

    if (!poll) {
      return { success: false, error: "Poll not found" };
    }

    // Check if poll has expired
    if (poll.expires_at) {
      const expirationDate = new Date(poll.expires_at);
      const now = new Date();
      if (now > expirationDate) {
        return { success: false, error: "This poll has expired" };
      }
    }

    // Validate option index
    if (validatedData.optionIndex < 0 || validatedData.optionIndex >= poll.options.length) {
      return { success: false, error: "Invalid option selected" };
    }

    // Get current user (optional for anonymous voting)
    const { data: { user } } = await supabase.auth.getUser();

    // Check for existing vote if user is authenticated
    if (user) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", validatedData.pollId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        return { success: false, error: "You have already voted on this poll" };
      }
    }

    // Insert the vote
    const { error: voteError } = await supabase
      .from("votes")
      .insert({
        poll_id: validatedData.pollId,
        option_index: validatedData.optionIndex,
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
      });

    if (voteError) {
      return { success: false, error: "Failed to submit vote" };
    }

    return { success: true, error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Client-side function to retrieve poll results with vote counts
 * 
 * This function fetches poll data along with aggregated vote counts for each option.
 * It provides real-time results that can be used to display poll statistics and
 * voting progress to users.
 * 
 * @param pollId - The unique identifier of the poll to retrieve results for
 * @returns Promise<{ poll: PollResults | null, error: string | null }> - Returns poll results or error message
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollResults('123e4567-e89b-12d3-a456-426614174000');
 * if (poll) {
 *   console.log(`Poll: ${poll.question}`);
 *   console.log(`Total votes: ${poll.totalVotes}`);
 *   poll.options.forEach(option => {
 *     console.log(`${option.text}: ${option.votes} votes (${option.percentage}%)`);
 *   });
 * }
 * ```
 */
export async function getPollResults(pollId: string): Promise<{ poll: PollResults | null, error: string | null }> {
  try {
    const supabase = createClient();

    // Fetch poll data
    const { data: pollData, error: pollError } = await supabase
      .from("polls")
      .select("id, question, options, created_at, expires_at, user_id")
      .eq("id", pollId)
      .single();

    if (pollError || !pollData) {
      return { poll: null, error: "Poll not found" };
    }

    // Fetch vote counts for each option
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("option_index")
      .eq("poll_id", pollId);

    if (votesError) {
      return { poll: null, error: "Failed to fetch vote data" };
    }

    // Calculate vote counts for each option
    const voteCounts = new Array(pollData.options.length).fill(0);
    votes?.forEach(vote => {
      if (vote.option_index >= 0 && vote.option_index < pollData.options.length) {
        voteCounts[vote.option_index]++;
      }
    });

    const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);

    // Create options with vote counts and percentages
    const optionsWithVotes: PollOptionWithVotes[] = pollData.options.map((option, index) => ({
      id: index.toString(),
      text: option,
      votes: voteCounts[index],
      percentage: totalVotes > 0 ? Math.round((voteCounts[index] / totalVotes) * 100) : 0,
    }));

    // Check if poll has expired
    const isExpired = pollData.expires_at ? new Date() > new Date(pollData.expires_at) : false;

    const pollResults: PollResults = {
      id: pollData.id,
      question: pollData.question,
      options: optionsWithVotes,
      totalVotes,
      isExpired,
      createdAt: new Date(pollData.created_at),
      expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
      createdBy: pollData.user_id,
    };

    return { poll: pollResults, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { poll: null, error: error.message };
    }
    return { poll: null, error: "An unexpected error occurred" };
  }
}

/**
 * Client-side function to check if a user has already voted on a poll
 * 
 * This function checks whether the current authenticated user has already
 * cast a vote on the specified poll. Useful for preventing duplicate votes
 * and showing appropriate UI states.
 * 
 * @param pollId - The unique identifier of the poll to check
 * @returns Promise<{ hasVoted: boolean, error: string | null }> - Returns voting status and error message
 * 
 * @example
 * ```typescript
 * const { hasVoted, error } = await hasUserVoted('123e4567-e89b-12d3-a456-426614174000');
 * if (hasVoted) {
 *   // Show results instead of voting interface
 * }
 * ```
 */
export async function hasUserVoted(pollId: string): Promise<{ hasVoted: boolean, error: string | null }> {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return { hasVoted: false, error: userError.message };
    }

    // If no user is authenticated, we can't check voting status
    if (!user) {
      return { hasVoted: false, error: null };
    }

    // Check if user has voted on this poll
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (voteError && voteError.code !== 'PGRST116') { // PGRST116 is "not found" error
      return { hasVoted: false, error: voteError.message };
    }

    return { hasVoted: !!vote, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { hasVoted: false, error: error.message };
    }
    return { hasVoted: false, error: "An unexpected error occurred" };
  }
}

// Re-export types for convenience
export type { PollOptionWithVotes, PollResults } from "@/app/lib/types";
