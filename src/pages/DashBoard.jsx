import React, { useState, useEffect, useRef } from "react";
import GroupList from "./GroupList";
import ChatBox from "./ChatBox";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link

const DashBoard = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messageGroups, setMessageGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); // Initialize navigate

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          navigate("/sign-in");
          return;
        }

        if (!session) {
          navigate("/sign-in");
          return;
        }

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
          return;
        }

        if (!userData) {
          console.error("No user data found");
          return;
        }

        setUser({
          ...session.user,
          ...userData,
        });
      } catch (error) {
        console.error("Error in checkSession:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from("channels") // Replace 'groups' with your actual table name
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching groups:", error);
      } else {
        setMessageGroups(data);
      }
    };

    fetchGroups();

    // Subscribe to new channels
    const channelsSubscription = supabase
      .channel("public:channels")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channels" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessageGroups((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      channelsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;

    const fetchMessages = async () => {
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
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${selectedGroup.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${selectedGroup.id}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
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
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            setMessages((prev) => [...prev, data]);
          }

          console.log("Setting up subscription for channel:", selectedGroup.id);
          console.log("New message received:", payload);
          console.log(
            "Cleaning up subscription for channel:",
            selectedGroup.id
          );
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [selectedGroup]);

  const handleCreateGroup = async () => {
    const newGroupName = prompt("Enter the name of the new group:");
    if (newGroupName) {
      const { error } = await supabase
        .from("channels") // Ensure t his matches your actual table name
        .insert([{ name: newGroupName }]); // Insert only the 'name' field

      if (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || !user) return;

    const { error } = await supabase.from("messages").insert([
      {
        content: newMessage.trim(),
        channel_id: selectedGroup.id,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
      {/* Left sidebar with message groups */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.username?.charAt(0)}`
              }
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold">{user?.username || user?.email}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-500">GROUPS</h3>
              <button
                onClick={handleCreateGroup}
                className="text-indigo-500 hover:text-indigo-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {messageGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full p-3 rounded-lg flex items-center space-x-3 hover:bg-gray-100 transition ${
                    selectedGroup?.id === group.id ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {group.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium">{group.name}</h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Right side with selected message group conversation */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold">{selectedGroup.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.user_id === user.id
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <img
                    src={
                      message.users?.avatar ||
                      `https://ui-avatars.com/api/?name=${message.users?.username?.charAt(
                        0
                      )}`
                    }
                    alt={message.users?.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div
                    className={`max-w-md ${
                      message.user_id === user.id
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100"
                    } rounded-lg p-3`}
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-medium ${
                          message.user_id === user.id
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        {message.users?.username || "Unknown User"}
                      </span>
                      <span
                        className={`text-xs ${
                          message.user_id === user.id
                            ? "text-indigo-100"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p
                      className={
                        message.user_id === user.id
                          ? "text-white"
                          : "text-gray-800"
                      }
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">
                Welcome to LimeChat
              </h2>
              <p className="text-gray-500 mt-2">
                Select a group to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${user?.username?.charAt(
                      0
                    )}`
                  }
                  alt="Profile"
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">
                    {user?.username || user?.email}
                  </h3>
                  <p className="text-gray-500">
                    Member since{" "}
                    {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                <p className="text-gray-800">{user?.email}</p>
              </div>
              <div className="pt-4">
                <Link
                  to="/profile"
                  className="block w-full text-center bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashBoard;
