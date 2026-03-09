import { NextResponse } from "next/server";
import { qualifyLead } from "@/server/ai";
import { aiLeadQualificationSchema } from "@/validation/ai";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = aiLeadQualificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const summary = await qualifyLead(parsed.data);

  return NextResponse.json({ success: true, summary });
}
