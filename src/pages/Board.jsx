import React, { useState } from "react";

const Board = () => {
  // Mock data for message groups
  const [messageGroups, setMessageGroups] = useState([
    { id: 1, name: "Team Alpha", unread: 2 },
    { id: 2, name: "Project Beta", unread: 0 },
    { id: 3, name: "General Chat", unread: 5 },
  ]);

  // Messages for the selected group
  const [messages, setMessages] = useState([
    { id: 1, sender: "User1", content: "Hello!" },
    { id: 2, sender: "User2", content: "Hi, how are you?" },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(1);

  // Function to send a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: "You", content: newMessage },
      ]);
      setNewMessage("");
    }
  };

  // Function to handle selecting a message group
  const handleSelectGroup = (groupId) => {
    setSelectedGroup(groupId);
    // In a real app, you would fetch messages for this group here
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar with message groups */}
      <div className="w-1/4 bg-white border-r border-gray-300 overflow-y-auto">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div>
          {messageGroups.map((group) => (
            <div
              key={group.id}
              className={`p-4 border-b border-gray-200 cursor-pointer ${
                selectedGroup === group.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectGroup(group.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{group.name}</span>
                {group.unread > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {group.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side with selected message group conversation */}
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
    </div>
  );
};

export default Board;
