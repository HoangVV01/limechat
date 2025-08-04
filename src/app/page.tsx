"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import { Search, Smile, Send, Sun, Moon, Paperclip, X, LogOut, UserPlus } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import styled from "styled-components";

type EmojiObject = {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useConversations,
  ConversationProvider,
} from "@/contexts/ConversationContext";
import { useMessages, MessageProvider } from "@/contexts/MessageContext";
import { getOrCreateOneToOneConversation } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserSearchModal } from "@/components/UserSearchModal";
import type { UserProfile } from "@/components/UserSearchModal";

// Initialize the GIPHY client
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY!);

const GifPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 320px;
  height: 400px;
  .giphy-grid {
    overflow-y: auto;
    height: calc(100% - 60px);
  }
`;

function ChatApp() {
  // Remove session and router logic from here
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use context for session
  const session = useAuth();
  const router = useRouter();

  const {
    conversations,
    selectedConversation,
    loading: conversationsLoading,
    error: conversationsError,
    selectConversation,
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

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const emojiPickerElement = document.querySelector('[data-emoji-picker="true"]');
      const gifPickerElement = document.querySelector('[data-gif-picker="true"]');

      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target) &&
        emojiPickerElement &&
        !emojiPickerElement.contains(target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        showGifPicker &&
        gifButtonRef.current &&
        !gifButtonRef.current.contains(target) &&
        gifPickerElement &&
        !gifPickerElement.contains(target)
      ) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, showGifPicker]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    if (!selectedConversation) return null;

    try {
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(`${selectedConversation.id}/${Date.now()}_${file.name}`, file);

      if (error) throw error;

      if (data) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${data.path}`;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;

    if (selectedFile) {
      // Upload file and send file URL
      const fileUrl = await uploadFileToSupabase(selectedFile);
      if (fileUrl) {
        await sendMessage(selectedConversation.id, fileUrl);
        setSelectedFile(null);
      }
    } else if (messageText.trim()) {
      // Send text message
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
      setMessageText(""); // Clear text when file is selected
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return '🖼️';
    } else if (['pdf'].includes(extension || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return '📊';
    } else if (['txt'].includes(extension || '')) {
      return '📃';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return '🎥';
    } else if (['mp3', 'wav', 'flac', 'aac'].includes(extension || '')) {
      return '🎵';
    }
    return '📎';
  };

  // User search is now handled by UserSearchModal component

  // Effect to handle dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!session) {
    return null;
  }

  // Main content is now directly in the return statement

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-96 border-r flex flex-col h-full ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
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

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut />
            </Button>
          </div>

          <h1 className="text-xl font-bold mb-3">Chats 
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserSearch(true)}
          >
            <UserPlus />
          </Button></h1>
         

          {/* User Search Modal */}
          <UserSearchModal
            open={showUserSearch}
            onClose={() => setShowUserSearch(false)}
            onUserSelect={async (user: UserProfile) => {
              try {
                const conversation = await getOrCreateOneToOneConversation(
                  session!.user.id,
                  user.id
                );
                if (conversation) {
                  selectConversation({
                    id: conversation.id,
                    created_at: conversation.created_at,
                    is_group: conversation.is_group,
                    name: user.username, // Always use the other user's username
                    avatar: user.avatar_url || "https://placehold.co/40x40s",
                    lastMessage: "",
                    timestamp: conversation.created_at,
                    isOnline: false,
                  });
                  setShowUserSearch(false);
                }
              } catch (error) {
                console.error('Failed to create conversation:', error);
                alert('Failed to create conversation');
              }
            }}
          />

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
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
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
                    className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${selectedConversation?.id === conversation.id
                      ? "bg-blue-50"
                      : ""
                      }`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            conversation.avatar || "https://placehold.co/40x40s"
                          }
                          alt={conversation.name}
                        />
                        <AvatarFallback>
                          {conversation.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

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
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
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
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        selectedConversation.avatar ||
                        "https://placehold.co/40x40s"
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

                </div>
                <div className="ml-3">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Active {selectedConversation.timestamp} ago
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="mr-2"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
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
                        className={`flex ${message.isOwn ? "justify-end" : "justify-start"
                          }`}
                      >
                        <div
                          className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.isOwn
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
                          {message.content.match(/https?:\/\/.*\.(?:gif|mp4)/i) ? (
                            <div style={{ maxWidth: '300px', position: 'relative' }}>
                              <Image
                                src={message.content.trim()}
                                alt="GIF"
                                width={300}
                                height={200}
                                className="rounded-lg object-contain"
                                unoptimized // for GIFs to work properly
                              />
                            </div>
                          ) : message.content.match(/https?:\/\/.*\.(?:jpg|jpeg|png|pdf|doc|docx|xls|xlsx|txt)/i) ? (
                            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <a
                                href={message.content.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm"
                              >
                                {message.content.split('/').pop()}
                              </a>
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl ${message.isOwn
                                ? "bg-blue-500 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                                }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {/* Selected File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeSelectedFile}
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!selectedFile} // Disable if file is already selected
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    ref={gifButtonRef}
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                    }}
                    disabled={!!selectedFile} // Disable if file is selected
                  >
                    GIF
                  </Button>
                  {showGifPicker && (
                    <GifPickerContainer
                      data-gif-picker="true"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg"
                          placeholder="Search GIFs..."
                          value={gifSearchQuery}
                          onChange={(e) => setGifSearchQuery(e.target.value)}
                        />
                      </div>
                      <Grid
                        key={gifSearchQuery}
                        onGifClick={(gif) => {
                          setMessageText(prev => prev + ` ${gif.images.fixed_height.url} `);
                          setShowGifPicker(false);
                        }}
                        noLink={true}
                        hideAttribution={true}
                        fetchGifs={() =>
                          gifSearchQuery
                            ? gf.search(gifSearchQuery, { limit: 10 })
                            : gf.trending({ limit: 10 })
                        }
                        width={300}
                        columns={2}
                        gutter={6}
                      />
                    </GifPickerContainer>
                  )}
                </div>

                <div className="flex-1 relative">
                  <input
                    placeholder={selectedFile ? "File selected - click send to upload" : "Type a message..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 pr-20 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!!selectedFile} // Disable text input when file is selected
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        ref={emojiButtonRef}
                        disabled={!!selectedFile} // Disable if file is selected
                      >
                        <Smile className="h-4 w-4 text-gray-400" />
                      </Button>
                      {showEmojiPicker && (
                        <div
                          className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                          data-emoji-picker="true"
                          style={{ backgroundColor: 'white' }}
                        >
                          <Picker
                            data={data}
                            previewPosition="none"
                            theme="light"
                            onEmojiSelect={(emoji: EmojiObject) => {
                              setMessageText(prev => prev + emoji.native);
                              setShowEmojiPicker(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && !selectedFile}
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