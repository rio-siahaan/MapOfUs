import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const cooldownMap = new Map<string, number>();

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const now = Date.now();
  const cooldown = cooldownMap.get(email);

  if (cooldown && now - cooldown < 30000) {
    return NextResponse.json(
      { error: "Please wait 30 seconds before registering again" },
      { status: 429 },
    );
  }

  cooldownMap.set(email, now);

  const supabase = await createClient();

  // Switch to signUp to trigger standard email confirmation flow
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if(error?.message.includes("User already registered")){
    await supabase.auth.resend({
      type: "signup",
      email
    })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Check your email to confirm your account.",
  });
}
