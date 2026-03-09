import { NextResponse } from "next/server";
import { generateChatReply } from "@/server/ai";
import { aiChatSchema } from "@/validation/ai";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = aiChatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reply = await generateChatReply(parsed.data.message);

  return NextResponse.json({ success: true, reply });
}
