import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import supabase from "@/lib/supabaseClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility type for conversations with participants
export type ConversationWithParticipants = {
  id: string;
  is_group: boolean;
  conversation_participants: { user_id: string }[];
};

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

  const oneToOne = (
    (existingConversations as ConversationWithParticipants[]) || []
  ).find((conv) => {
    const participantIds = conv.conversation_participants.map((p) => p.user_id);
    return (
      participantIds.includes(userA_id) &&
      participantIds.includes(userB_id) &&
      participantIds.length === 2
    );
  });

  if (oneToOne) {
    return oneToOne;
  }

  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({ is_group: false })
    .select()
    .single();

  if (createError || !newConversation) {
    console.error("Error creating conversation:", createError);
    return null;
  }

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
