"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "../login/page";

export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/dashboard");
  }

  return <AuthForm title="Create account" cta="Create account" loading={loading} error={error} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSignup} footer={<>Have an account? <Link href="/login" style={{ color: "#06B6D4" }}>Sign in</Link></>} />;
}
