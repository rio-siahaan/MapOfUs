"use client"

import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("@/components/AuthPage"), {
  ssr: false,
  loading: () => <p>Loading Login Page...</p>,
});

export default function Login() {
  return <LoginPage />;
}