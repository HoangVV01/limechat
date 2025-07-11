"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
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
        onSubmit={handleLogin}
        className="bg-gray-50 p-8 rounded-lg shadow-md w-full max-w-sm space-y-6"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
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
          {loading ? "Logging in..." : "Login"}
        </Button>
        <p className="text-sm text-center">
          Don&apos;t have an account?&nbsp;
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
