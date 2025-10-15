import { useState } from "react";
import { Search, LogOut, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations } from "@/contexts/ConversationContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserSearchModal } from "@/components/UserSearchModal";
import { getOrCreateOneToOneConversation } from "@/lib/utils";
import supabase from "@/lib/supabaseClient";
import type { UserProfile } from "@/components/UserSearchModal";
interface SidebarProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function Sidebar({setIsModalOpen }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);

  const session = useAuth();
  const {
    conversations,
    selectedConversation,
    selectConversation,
  } = useConversations();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-96 border-r flex flex-col h-full border-gray-200 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
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

        <h1 className="text-xl font-bold mb-3">
          Chats
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserSearch(true)}
          >
            <UserPlus />
          </Button>
        </h1>

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
                  name: user.username,
                  avatar_url: user.avatar_url || "https://placehold.co/40x40s",
                  lastMessage: "",
                  timestamp: conversation.created_at,
                  isOnline: false,
                });
                setShowUserSearch(false);
              }
            } catch (error) {
              console.error("Failed to create conversation:", error);
              alert("Failed to create conversation");
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
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          conversation.avatar_url ||
                          "https://placehold.co/40x40s"
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
  );
}
