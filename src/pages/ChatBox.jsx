import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Adjust the import path as necessary
import { useNavigate } from "react-router-dom";

const ChatBox = ({ messageGroups, selectedGroup }) => {
  const [messages, setMessages] = useState([]); // Initialize as an empty array
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching user session:", error);
      } else {
        setUser(session?.user);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedGroup?.id) {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            *,
            users:user_id (
              username,
              avatar
            )
          `
          )
          .eq("channel_id", selectedGroup.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
        } else {
          setMessages(data || []);
        }
      }
    };

    fetchMessages();

    // Set up real-time subscription
    if (selectedGroup?.id) {
      const channelId = selectedGroup.id;
      console.log("Setting up subscription for channel:", channelId);

      const subscription = supabase
        .channel(`messages:${channelId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${channelId}`,
          },
          (payload) => {
            console.log("New message received:", payload);
            // Immediately add the new message to the state
            setMessages((prev) => [
              ...prev,
              {
                ...payload.new,
                users: {
                  username: user?.id === payload.new.user_id ? "You" : "User",
                  avatar: null,
                },
              },
            ]);
          }
        )
        .subscribe();

      // Cleanup subscription on unmount or when selectedGroup changes
      return () => {
        console.log("Cleaning up subscription for channel:", channelId);
        subscription.unsubscribe();
      };
    }
  }, [selectedGroup?.id, user?.id]);

  const handleSendMessage = async () => {
    if (newMessage.trim() !== "" && selectedGroup?.id && user) {
      // Create a temporary message object
      const tempMessage = {
        id: Date.now(), // Temporary ID
        content: newMessage,
        channel_id: selectedGroup.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        users: {
          username: "You",
          avatar: null,
        },
      };

      // Immediately add the message to the state
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Send the message to the database
      const { error } = await supabase.from("messages").insert([
        {
          channel_id: selectedGroup.id,
          content: newMessage,
          user_id: user.id,
        },
      ]);

      if (error) {
        console.error("Error sending message:", error);
        // Remove the temporary message if there was an error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      }
    }
  };

  useEffect(() => {
    if (user) {
      setTimeout(() => navigate("/dashboard"), 3000);
    }
  }, [user, navigate]);

  return (
    <div className="w-3/4 flex flex-col">
      {/* Header showing current group */}
      <div className="p-4 border-b border-gray-300 bg-white">
        <h2 className="text-xl font-semibold">
          {selectedGroup?.name || "Chat"}
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3/4 p-3 mb-3 rounded-lg ${
              message.user_id === user?.id
                ? "bg-blue-100 ml-auto"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="font-semibold text-sm text-gray-700 mb-1">
              {message.user_id === user?.id
                ? "You"
                : message.users?.username || `User ${message.user_id}`}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-300 bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
