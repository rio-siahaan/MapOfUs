import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const cooldownMap = new Map<string, number>();

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const now = Date.now();
  const cooldown = cooldownMap.get(email);

  if (cooldown && now - cooldown < 30000) {
    return NextResponse.json(
      { error: "Please wait 30 seconds before login again" },
      { status: 429 },
    );
  }

  cooldownMap.set(email, now);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
