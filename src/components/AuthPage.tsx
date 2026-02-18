"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const refreshPage = () => {
    setError(false);
    setStatus(null);
    setIsRegistering(!isRegistering);
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("Error logging in:", error.message);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setStatus("");

    try {
      if (isRegistering) {
        if (password != confirmPassword) {
          setError(true);
          setStatus("Your password is not match!");
          return;
        }
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(true);
          setStatus("Your register is failed: " + data.error);
          return;
        }
        setStatus(
          "Your register is success, please check in your email and spam to confirm!",
        );
        setCooldown(30);
      } else {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(true);
          setStatus("Your login is failed: " + data.error);
          return;
        }

        setStatus("Your login is success, redirecting to map!");
        router.push("/");
        setCooldown(30);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(true);
        setStatus("Your authentication is failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-br from-orange-500 to-purple-600 bg-clip-text text-transparent">
              {isRegistering ? "Create Account!" : "Welcome back!"}
            </h2>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Back to Map
            </Link>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-transparent border border-gray-600 rounded-lg hover:bg-white/5 transition-colors font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <p className="text-black ">Continue with Google</p>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  required
                  className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                >
                  Enter your email
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                >
                  Enter your password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="cursor-pointer" />
                  ) : (
                    <Eye size={20} className="cursor-pointer" />
                  )}
                </button>
              </div>
              {isRegistering && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    required
                    className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                  >
                    Confirm your password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} className="cursor-pointer" />
                    ) : (
                      <Eye size={20} className="cursor-pointer" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {error ? (
              <div className="text-red-500 text-sm font-bold">{status}</div>
            ) : (
              <div className="text-green-500 text-sm font-bold">{status}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? "Processing..."
                  : cooldown > 0
                    ? "Please wait " +
                      cooldown +
                      " seconds before " +
                      (isRegistering ? "registering" : "logging in")
                    : isRegistering
                      ? "Sign Up"
                      : "Sign In"}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => refreshPage()}
              className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Map Preview */}
      <div className="hidden md:block w-1/2 bg-gray-100 relative overflow-hidden">
        {/* We can reuse the Map component but make it non-interactive or just visual */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <Map interactive={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent z-10 flex items-end p-12">
          <div className="text-white">
            <h3 className="text-4xl font-bold mb-4">Share your story.</h3>
            <p className="text-lg text-gray-200">
              Pin your memories on the map and share them with the world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
