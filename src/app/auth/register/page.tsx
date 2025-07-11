"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.replace("/");
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <form
        onSubmit={handleRegister}
        className="bg-gray-50 p-8 rounded-lg shadow-md w-full max-w-sm space-y-6"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
        <p className="text-sm text-center">
          Already have an account?&nbsp;
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
