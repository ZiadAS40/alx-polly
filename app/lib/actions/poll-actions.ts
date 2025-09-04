"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPollSchema, voteSchema, updatePollSchema } from "@/lib/validations/poll";
import { rateLimit } from "@/lib/rate-limit";

// CREATE POLL
export async function createPoll(formData: FormData) {
  try {
    const supabase = await createClient();

    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    // Validate input
    const validatedData = createPollSchema.parse({
      question,
      options,
    });

    // Get user from session
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

    const { error } = await supabase.from("polls").insert([
      {
        user_id: user.id,
        question: validatedData.question,
        options: validatedData.options,
      },
    ]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  try {
    const supabase = await createClient();
    
    // Validate input
    const validatedData = voteSchema.parse({
      pollId,
      optionIndex,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limiting for voting
    const rateLimitKey = user ? `vote:${user.id}` : `vote:anonymous:${pollId}`;
    const rateLimitResult = rateLimit(rateLimitKey, 5, 60000); // 5 votes per minute
    
    if (!rateLimitResult.success) {
      return { error: "Too many votes. Please wait before voting again." };
    }

    // Check if user has already voted on this poll
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

    // Verify poll exists and get options count
    const { data: poll } = await supabase
      .from("polls")
      .select("options")
      .eq("id", validatedData.pollId)
      .single();

    if (!poll) {
      return { error: "Poll not found." };
    }

    if (validatedData.optionIndex >= poll.options.length) {
      return { error: "Invalid option selected." };
    }

    const { error } = await supabase.from("votes").insert([
      {
        poll_id: validatedData.pollId,
        user_id: user?.id ?? null,
        option_index: validatedData.optionIndex,
      },
    ]);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

// DELETE POLL
export async function deletePoll(id: string) {
  try {
    const supabase = await createClient();
    
    // Get user from session
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

    // Only allow deleting polls owned by the user
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const supabase = await createClient();

    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    // Validate input
    const validatedData = updatePollSchema.parse({
      pollId,
      question,
      options,
    });

    // Get user from session
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

    // Only allow updating polls owned by the user
    const { error } = await supabase
      .from("polls")
      .update({ 
        question: validatedData.question, 
        options: validatedData.options 
      })
      .eq("id", validatedData.pollId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/polls");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}
