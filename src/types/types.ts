export interface Conversation {
  id: string;
  created_at: string;
  is_group: boolean;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface DatabaseSchema {
  conversations: Conversation;
  conversation_participants: ConversationParticipant;
  profiles: Profile;
  messages: Message;
}
