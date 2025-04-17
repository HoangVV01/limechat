import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    username: "",
    email: "",
    avatar: "",
    created_at: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          navigate("/sign-in");
          return;
        }

        if (!session) {
          navigate("/sign-in");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (!data) {
          console.error("No user data found");
          return;
        }

        setUser({
          username: data.username || "",
          email: session.user.email,
          avatar: data.avatar || "",
          created_at: data.created_at,
        });
      } catch (error) {
        console.error("Error in fetchUser:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/sign-in");
        return;
      }

      const { error } = await supabase.from("users").upsert({
        id: session.user.id,
        username: user.username,
        avatar: user.avatar,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error updating user:", error);
        return;
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error in handleSave:", error);
    }
  };

  const subscription = supabase
    .channel(`messages:${selectedGroup}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${selectedGroup}`,
      },
      async (payload) => {
        // Fetch and add new message
      }
    )
    .subscribe();

  useEffect(() => {
    return () => {
      subscription.unsubscribe();
    };
  }, [subscription]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center p-6">
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${user.username?.charAt(0)}`
            }
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500 shadow-sm"
          />
          {isEditing ? (
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleInputChange}
              className="mt-4 text-2xl font-bold text-gray-800 bg-gray-100 rounded px-2 py-1 w-full text-center"
              placeholder="Username"
            />
          ) : (
            <h2 className="mt-4 text-2xl font-bold text-gray-800">
              {user.username || user.email}
            </h2>
          )}
          <p className="text-sm text-gray-500">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="mb-4">
            <h3 className="text-sm text-gray-400">Email</h3>
            <p className="text-md text-gray-700">{user.email}</p>
          </div>
          {isEditing && (
            <div className="mb-4">
              <h3 className="text-sm text-gray-400">Avatar URL</h3>
              <input
                type="text"
                name="avatar"
                value={user.avatar}
                onChange={handleInputChange}
                className="text-md text-gray-700 bg-gray-100 rounded px-2 py-1 w-full"
                placeholder="Enter avatar URL"
              />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
