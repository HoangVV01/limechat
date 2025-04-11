import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";

const RecoverAccount = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get the access token from URL query parameters
  // This will be present when the user clicks the reset link from their email
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    // If no access token is present, redirect to login
    if (!accessToken) {
      setError("Invalid or expired recovery link");
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [accessToken, navigate]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage("");
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);

      // Update user's password using the access token
      const { error } = await supabase.auth.updateUser(
        { password },
        { accessToken }
      );

      if (error) throw error;

      setMessage("Your password has been successfully reset!");

      // Redirect to login page after successful password reset
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Recover Your Account
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {accessToken ? (
          <form onSubmit={handlePasswordReset}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-700">
            Checking recovery link...
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-500 hover:underline focus:outline-none"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecoverAccount;
