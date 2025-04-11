import React, { useState } from "react";
import GroupList from "./GroupList";
import ChatBox from "./ChatBox";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const DashBoard = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messageGroups, setMessageGroups] = useState([
    { id: 1, name: "Team Alpha", unread: 2 },
    { id: 2, name: "Project Beta", unread: 0 },
    { id: 3, name: "General Chat", unread: 5 },
  ]);
  const navigate = useNavigate(); // Initialize navigate

  const handleCreateGroup = () => {
    const newGroupName = prompt("Enter the name of the new group:");
    if (newGroupName) {
      const newGroup = {
        id: messageGroups.length + 1, // Simple ID generation
        name: newGroupName,
        unread: 0,
      };
      setMessageGroups([...messageGroups, newGroup]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/sign-in"); // Redirect to sign-in page
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
      {/* Left sidebar with message groups */}
      <GroupList
        messageGroups={messageGroups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        onCreateGroup={handleCreateGroup}
      />
      {/* Right side with selected message group conversation */}
      <ChatBox messageGroups={messageGroups} selectedGroup={selectedGroup} />
    </div>
  );
};

export default DashBoard;
