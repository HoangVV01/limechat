"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import supabase from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import type { Conversation as DbConversation } from "@/types/types";

interface Conversation extends DbConversation {
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  unreadCount?: number;
}

interface ConversationContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  createConversation: (name: string, isGroup: boolean) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  updateConversation: (
    id: string,
    updates: Partial<Conversation>
  ) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

export function ConversationProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      // First, get all conversations where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", session.user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      // Get the conversation IDs
      const conversationIds = participantData.map((p) => p.conversation_id);

      // Fetch the actual conversations
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("created_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get the latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            lastMessage: lastMessage?.content || "No messages yet",
            lastMessageTime: lastMessage?.created_at || conv.created_at,
          };
        })
      );

      // Transform the data to match our Conversation interface
      const transformedConversations: Conversation[] =
        conversationsWithMessages.map((conv) => ({
          id: conv.id,
          created_at: conv.created_at,
          is_group: conv.is_group,
          name: `Conversation ${conv.id.slice(0, 8)}`,
          avatar: "https://placehold.co/40x40s",
          lastMessage: conv.lastMessage,
          timestamp: formatTimestamp(conv.lastMessageTime),
          isOnline: false,
          unreadCount: 0,
        }));

      setConversations(transformedConversations);

      if (!selectedConversation && transformedConversations.length > 0) {
        setSelectedConversation(transformedConversations[0]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user, selectedConversation]);

  const createConversation = async (name: string, isGroup: boolean) => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          is_group: isGroup,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add the current user as a participant
      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversation.id,
          user_id: session.user.id,
        });

      if (participantError) throw participantError;

      // Refresh conversations to include the new one
      await fetchConversations();
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const updateConversation = async (
    id: string,
    updates: Partial<Conversation>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Only update fields that exist in the database schema
      const dbUpdates: Partial<DbConversation> = {};
      if ("is_group" in updates) {
        dbUpdates.is_group = updates.is_group;
      }

      // If there are no database fields to update, just update local state
      if (Object.keys(dbUpdates).length === 0) {
        setConversations((prev) =>
          prev.map((conv) => (conv.id === id ? { ...conv, ...updates } : conv))
        );

        if (selectedConversation?.id === id) {
          setSelectedConversation((prev) =>
            prev ? { ...prev, ...updates } : null
          );
        }
        return;
      }

      const { error } = await supabase
        .from("conversations")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, ...updates } : conv))
      );

      // Update selected conversation if it's the one being updated
      if (selectedConversation?.id === id) {
        setSelectedConversation((prev) =>
          prev ? { ...prev, ...updates } : null
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      // Clear selected conversation if it was deleted
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshConversations = async () => {
    await fetchConversations();
  };

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Fetch conversations when session changes
  useEffect(() => {
    if (session?.user) {
      fetchConversations();
    } else {
      setConversations([]);
      setSelectedConversation(null);
    }
  }, [session?.user, fetchConversations]);

  const value: ConversationContextType = {
    conversations,
    selectedConversation,
    loading,
    error,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    refreshConversations,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversations must be used within a ConversationProvider"
    );
  }
  return context;
}
