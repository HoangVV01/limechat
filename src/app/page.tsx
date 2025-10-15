"use client";

import { useState, useEffect } from "react";
import {
  useConversations,
  ConversationProvider,
} from "@/contexts/ConversationContext";
import { useMessages, MessageProvider } from "@/contexts/MessageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessagesList } from "@/components/chat/MessagesList";
import { MessageInput } from "@/components/chat/MessageInput";
import UserProfileModal from "@/components/UserProfileModal";

function ChatApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const session = useAuth();
  const router = useRouter();

  const {
    selectedConversation,
    loading: conversationsLoading,
    error: conversationsError,
  } = useConversations();

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    fetchMessages,
  } = useMessages();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/auth/login");
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    if (!selectedConversation) return null;

    try {
      const { data, error } = await supabase.storage
        .from("chat-files")
        .upload(`${selectedConversation.id}/${Date.now()}_${file.name}`, file);

      if (error) throw error;

      if (data) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${data.path}`;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;

    if (selectedFile) {
      const fileUrl = await uploadFileToSupabase(selectedFile);
      if (fileUrl) {
        await sendMessage(selectedConversation.id, fileUrl);
        setSelectedFile(null);
      }
    } else if (messageText.trim()) {
      await sendMessage(selectedConversation.id, messageText);
    }

    setMessageText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessageText("");
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900">
      <Sidebar isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {conversationsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">Loading conversations...</div>
          </div>
        ) : conversationsError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500">Error: {conversationsError}</div>
          </div>
        ) : selectedConversation ? (
          <>
            <ChatHeader selectedConversation={selectedConversation} />

            <MessagesList
              messages={messages}
              messagesLoading={messagesLoading}
              messagesError={messagesError}
              selectedConversation={selectedConversation}
            />

            <MessageInput
              messageText={messageText}
              setMessageText={setMessageText}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              onSendMessage={handleSendMessage}
              onFileSelect={handleFileSelect}
              onKeyPress={handleKeyPress}
            />
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

      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={{
          username: session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "",
          avatarUrl: session?.user?.user_metadata?.avatar_url || null,
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <ConversationProvider>
        <MessageProvider>
          <ChatApp />
        </MessageProvider>
      </ConversationProvider>
    </AuthProvider>
  );
}
