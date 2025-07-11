import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import supabase from "@/lib/supabaseClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get or create a 1-to-1 conversation between two users.
 * @param userA_id - The first user's UUID (usually the current user)
 * @param userB_id - The second user's UUID (the user you want to chat with)
 * @returns The conversation object (or null if error)
 */
export async function getOrCreateOneToOneConversation(
  userA_id: string,
  userB_id: string
) {
  // 1. Check if a conversation already exists between these two users
  // Find all conversations where both users are participants and the conversation is not a group
  const { data: existingConversations, error: fetchError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      is_group,
      conversation_participants!inner(user_id)
    `
    )
    .eq("is_group", false)
    .in("conversation_participants.user_id", [userA_id, userB_id]);

  if (fetchError) {
    console.error("Error fetching conversations:", fetchError);
    return null;
  }

  // Filter for conversations where BOTH users are participants
  const oneToOne = (existingConversations || []).find((conv: any) => {
    const participantIds = conv.conversation_participants.map(
      (p: any) => p.user_id
    );
    return (
      participantIds.includes(userA_id) &&
      participantIds.includes(userB_id) &&
      participantIds.length === 2
    );
  });

  if (oneToOne) {
    // Conversation already exists
    return oneToOne;
  }

  // 2. Create a new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({ is_group: false })
    .select()
    .single();

  if (createError || !newConversation) {
    console.error("Error creating conversation:", createError);
    return null;
  }

  // 3. Add both users as participants
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: newConversation.id, user_id: userA_id },
      { conversation_id: newConversation.id, user_id: userB_id },
    ]);

  if (partError) {
    console.error("Error adding participants:", partError);
    return null;
  }

  return newConversation;
}
