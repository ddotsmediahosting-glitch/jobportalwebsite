import { NextResponse } from "next/server";
import { clearAdminSession } from "@/server/admin/auth";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
