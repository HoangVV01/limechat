import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip } from "lucide-react";
import Image from "next/image";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: string;
  isOwn: boolean;
}

interface MessagesListProps {
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  selectedConversation: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export function MessagesList({
  messages,
  messagesLoading,
  messagesError,
  selectedConversation,
}: MessagesListProps) {
  return (
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
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
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
                          selectedConversation.avatar_url ||
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
                  {message.content.match(
                    /https?:\/\/.*\.(?:gif|mp4)/i
                  ) ? (
                    <div
                      style={{
                        maxWidth: "300px",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={message.content.trim()}
                        alt="GIF"
                        width={300}
                        height={200}
                        className="rounded-lg object-contain"
                        unoptimized // for GIFs to work properly
                      />
                    </div>
                  ) : message.content.match(
                      /https?:\/\/.*\.(?:jpg|jpeg|png|pdf|doc|docx|xls|xlsx|txt)/i
                    ) ? (
                    <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <a
                        href={message.content.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        {message.content.split("/").pop()}
                      </a>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.isOwn
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
  );
}
