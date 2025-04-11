import React, { useState } from "react";

const ChatBox = ({ messageGroups, selectedGroup }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "User1", content: "Hello!" },
    { id: 2, sender: "User2", content: "Hi, how are you?" },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: "You", content: newMessage },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="w-3/4 flex flex-col">
      {/* Header showing current group */}
      <div className="p-4 border-b border-gray-300 bg-white">
        <h2 className="text-xl font-semibold">
          {messageGroups.find((g) => g.id === selectedGroup)?.name || "Chat"}
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3/4 p-3 mb-3 rounded-lg ${
              message.sender === "You"
                ? "bg-blue-100 ml-auto"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="font-semibold text-sm text-gray-700 mb-1">
              {message.sender}
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
