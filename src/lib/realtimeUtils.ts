import supabase from "./supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeConfig {
  eventsPerSecond?: number;
  heartbeatIntervalMs?: number;
  reconnectAfterMs?: number;
}

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      eventsPerSecond: 10,
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: 1000,
      ...config,
    };
  }

  subscribeToMessages(
    conversationId: string,
    onMessage: (payload: {
      new: {
        id: string;
        content: string;
        created_at: string;
        sender_id: string;
      };
    }) => void,
    onError?: (error: string) => void,
    onStatusChange?: (status: string) => void
  ): RealtimeChannel {
    // Unsubscribe from existing channel if it exists
    this.unsubscribeFromMessages(conversationId);

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        onMessage
      )
      .on("presence", { event: "sync" }, () => {
        console.log("Presence sync for conversation:", conversationId);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log(
          "User joined conversation:",
          conversationId,
          key,
          newPresences
        );
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log(
          "User left conversation:",
          conversationId,
          key,
          leftPresences
        );
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${conversationId}:`, status);
        onStatusChange?.(status);

        if (status === "CHANNEL_ERROR") {
          onError?.("Failed to connect to realtime channel");
        }
      });

    this.channels.set(conversationId, channel);
    return channel;
  }

  unsubscribeFromMessages(conversationId: string): void {
    const channel = this.channels.get(conversationId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(conversationId);
    }
  }

  unsubscribeFromAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  getChannel(conversationId: string): RealtimeChannel | undefined {
    return this.channels.get(conversationId);
  }

  isSubscribed(conversationId: string): boolean {
    return this.channels.has(conversationId);
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();

// Utility functions
export const formatMessageTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

export const isMessageFromToday = (timestamp: string): boolean => {
  const messageDate = new Date(timestamp);
  const today = new Date();
  return messageDate.toDateString() === today.toDateString();
};

export const isMessageFromYesterday = (timestamp: string): boolean => {
  const messageDate = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return messageDate.toDateString() === yesterday.toDateString();
};
