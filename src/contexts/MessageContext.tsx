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
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message as DbMessage } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

interface Message extends Omit<DbMessage, "conversation_id" | "sender_id"> {
  sender: string;
  isOwn: boolean;
}

interface MessageContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const session = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(
    null
  );

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!session?.user) return;

      setLoading(true);
      setError(null);
      setCurrentConversationId(conversationId);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
          *,
          profiles!messages_sender_id_fkey(username, avatar_url)
        `
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Transform the data to match our Message interface
        const transformedMessages: Message[] = (data || []).map(
          (
            msg: DbMessage & {
              profiles?: {
                username: string;
                avatar_url: string | null;
              };
            }
          ) => ({
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            sender:
              msg.profiles?.username ||
              (msg.sender_id === session.user.id ? "You" : "User"),
            isOwn: msg.sender_id === session.user.id,
          })
        );

        setMessages(transformedMessages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch messages"
        );
      } finally {
        setLoading(false);
      }
    },
    [session?.user]
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!session?.user || !content.trim()) return;

      setError(null);

      try {
        const { data: message, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: session.user.id,
            content: content.trim(),
          })
          .select(
            `
          *,
          profiles!messages_sender_id_fkey(username, avatar_url)
        `
          )
          .single();

        if (error) throw error;

        // Add the new message to the local state
        const newMessage: Message = {
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          sender: message.profiles?.username || "You",
          isOwn: true,
        };

        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [session?.user]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!session?.user) return;

      try {
        // You can implement read receipts here if you have a read_messages table
        // For now, we'll just log that messages were read
        console.log(
          `Messages marked as read for conversation: ${conversationId}`
        );
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [session?.user]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  // Set up real-time subscription for new messages
  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      if (!session?.user || !currentConversationId) {
        return;
      }

      currentChannel = supabase
        .channel(`messages:${currentConversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${currentConversationId}`,
          },
          async (payload) => {
            // Only add the message if it's not from the current user (to avoid duplicates)
            if (payload.new.sender_id !== session.user.id) {
              try {
                // Fetch the sender's profile to get the username
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("username, avatar_url")
                  .eq("id", payload.new.sender_id)
                  .single();

                const newMessage: Message = {
                  id: payload.new.id,
                  content: payload.new.content,
                  created_at: payload.new.created_at,
                  sender: profile?.username || "Unknown User",
                  isOwn: false,
                };

                setMessages((prev) => [...prev, newMessage]);

                // Mark messages as read when they come in
                await markAsRead(currentConversationId);
              } catch (err) {
                console.error("Error fetching sender profile:", err);
                // Fallback to basic message if profile fetch fails
                const newMessage: Message = {
                  id: payload.new.id,
                  content: payload.new.content,
                  created_at: payload.new.created_at,
                  sender: "User",
                  isOwn: false,
                };
                setMessages((prev) => [...prev, newMessage]);
              }
            }
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("Presence sync");
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("Presence join:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("Presence leave:", key, leftPresences);
        })
        .subscribe((status) => {
          console.log("Subscription status:", status);
          setIsConnected(status === "SUBSCRIBED");

          if (status === "CHANNEL_ERROR") {
            setError("Failed to connect to realtime channel");
          } else if (status === "SUBSCRIBED") {
            setError(null);
          }
        });

      setSubscription(currentChannel);
    };

    setupSubscription();

    return () => {
      if (currentChannel) {
        currentChannel.unsubscribe();
      }
      setSubscription(null);
    };
  }, [session?.user, currentConversationId, markAsRead]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const value: MessageContextType = {
    messages,
    loading,
    error,
    isConnected,
    sendMessage,
    fetchMessages,
    clearMessages,
    markAsRead,
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessageProvider");
  }
  return context;
}
