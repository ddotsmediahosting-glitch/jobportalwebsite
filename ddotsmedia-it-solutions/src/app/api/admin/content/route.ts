import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/admin/auth";
import { saveSiteContent, getSiteContent } from "@/server/content/store";
import { siteContentSchema } from "@/server/content/site-content-schema";

export async function GET() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = siteContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const saved = await saveSiteContent(parsed.data);

  return NextResponse.json({ success: true, content: saved });
}
