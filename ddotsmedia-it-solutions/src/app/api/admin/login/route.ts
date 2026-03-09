import { NextResponse } from "next/server";
import { createAdminSession, validateAdminCredentials } from "@/server/admin/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };

  if (!body.username || !body.password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  if (!validateAdminCredentials(body.username, body.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createAdminSession();

  return NextResponse.json({ success: true });
}
