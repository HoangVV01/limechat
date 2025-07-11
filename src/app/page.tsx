"use client";

import { useState, useEffect } from "react";
import type React from "react";
import { Search, Smile, Plus, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RealtimeStatus } from "@/components/RealtimeStatus";
import supabase from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  useConversations,
  ConversationProvider,
} from "@/contexts/ConversationContext";
import { useMessages, MessageProvider } from "@/contexts/MessageContext";
import { getOrCreateOneToOneConversation } from "@/lib/utils";

function ChatApp() {
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  const {
    conversations,
    selectedConversation,
    loading: conversationsLoading,
    error: conversationsError,
    createConversation,
    selectConversation,
  } = useConversations();

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    isConnected,
    sendMessage,
    fetchMessages,
  } = useMessages();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session) {
        router.replace("/auth/login");
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          router.replace("/auth/login");
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedConversation) {
      await sendMessage(selectedConversation.id, messageText);
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = async () => {
    if (!session?.user) return;
    const email = prompt(
      "Enter the email address of the person you want to chat with:"
    );
    if (!email || !email.trim()) return;

    // Look up the other user's ID by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", email)
      .single();

    if (profileError || !profile) {
      alert("User not found");
      return;
    }

    const conversation = await getOrCreateOneToOneConversation(
      session.user.id,
      profile.id
    );
    if (conversation) {
      // Select the conversation in the UI
      selectConversation({
        id: conversation.id,
        created_at: conversation.created_at,
        is_group: conversation.is_group,
        name: email,
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: "",
        timestamp: conversation.created_at,
        isOnline: false,
        unreadCount: 0,
      });
    } else {
      alert("Failed to create or fetch conversation");
    }
  };

  if (!session) {
    return null;
  }

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading conversations...</div>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {conversationsError}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.user_metadata?.full_name ||
                    session?.user?.email?.split("@")[0] ||
                    "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateConversation}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <h1 className="text-xl font-bold mb-3">Chats</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              placeholder="Search Conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-0 rounded-full w-full px-3 py-2"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No conversations yet. Click the + button to create one!
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={conversation.avatar || "/placeholder.svg"}
                        alt={conversation.name}
                      />
                      <AvatarFallback>
                        {conversation.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {conversation.unreadCount && (
                    <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedConversation.avatar || "/placeholder.svg"}
                      alt={selectedConversation.name}
                    />
                    <AvatarFallback>
                      {selectedConversation.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.isOnline
                      ? "Active now"
                      : "Active 2h ago"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <RealtimeStatus
                  isConnected={isConnected}
                  error={messagesError}
                />
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading && (
                <div className="text-xs text-gray-400 mb-2">Loading...</div>
              )}
              {messagesError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">Error: {messagesError}</div>
                </div>
              ) : messages.length === 0 && !messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <h3 className="text-lg font-medium mb-2">
                      No messages yet
                    </h3>
                    <p>Start the conversation by sending a message!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                          message.isOwn
                            ? "flex-row-reverse space-x-reverse"
                            : ""
                        }`}
                      >
                        {!message.isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                selectedConversation.avatar ||
                                "/placeholder.svg"
                              }
                              alt={selectedConversation.name}
                            />
                            <AvatarFallback>
                              {selectedConversation.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.isOwn
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5 text-blue-500" />
                </Button>

                <div className="flex-1 relative">
                  <input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 pr-20 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Smile className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  size="icon"
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">
                No conversation selected
              </h3>
              <p>Select a conversation from the sidebar or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session) {
        router.replace("/auth/login");
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          router.replace("/auth/login");
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!session) {
    return null;
  }

  return (
    <ConversationProvider session={session}>
      <MessageProvider session={session}>
        <ChatApp />
      </MessageProvider>
    </ConversationProvider>
  );
}
