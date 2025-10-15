import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
  selectedConversation: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export function ChatHeader({ selectedConversation }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div className="flex items-center">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={
                selectedConversation.avatar_url ||
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
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {selectedConversation.name}
          </h2>
        </div>
      </div>
    </div>
  );
}
