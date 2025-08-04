import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Button } from "@/components/ui/button";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
};

interface UserSearchModalProps {
  open: boolean;
  onClose: () => void;
  onUserSelect: (user: UserProfile) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ open, onClose, onUserSelect }) => {
  const session = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError("");
      return;
    }
    if (query.trim() === "") {
      setResults([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    const timeout = setTimeout(async () => {
      if (!session?.user) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `*${query}*`)
        .neq("id", session.user.id);
      setLoading(false);
      if (error) {
        setError("Error searching users");
        setResults([]);
      } else if (data && data.length > 0) {
        setResults(data);
      } else {
        setResults([]);
        setError("No users found");
      }
    }, 400); // debounce
    return () => clearTimeout(timeout);
  }, [query, open, session?.user]);

  if (!open) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Find User</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          {loading && <p className="text-gray-500 text-sm">Searching...</p>}
          {error && !loading && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-40 overflow-y-auto">
            {results.map(user => (
              <div
                key={user.id}
                className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => onUserSelect(user)}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                  {user.username ? user.username[0].toUpperCase() : "U"}
                </div>
                <div>
                  <div className="font-medium">{user.username || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
}; 