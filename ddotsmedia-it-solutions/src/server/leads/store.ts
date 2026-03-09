import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RequestContext } from "@/server/http/request-context";

export type StoredLead = {
  id: string;
  channel: string;
  createdAt: string;
  payload: unknown;
  context: RequestContext;
};

const storageDir = path.join(process.cwd(), "storage");
const storagePath = path.join(storageDir, "leads.json");

async function ensureLeadsFile() {
  await mkdir(storageDir, { recursive: true });

  try {
    await readFile(storagePath, "utf8");
  } catch {
    await writeFile(storagePath, "[]", "utf8");
  }
}

export async function persistLead(lead: StoredLead) {
  await ensureLeadsFile();
  const raw = await readFile(storagePath, "utf8");
  const leads = JSON.parse(raw) as StoredLead[];
  leads.unshift(lead);
  await writeFile(storagePath, JSON.stringify(leads.slice(0, 200), null, 2), "utf8");
}

export async function listLeads() {
  await ensureLeadsFile();
  const raw = await readFile(storagePath, "utf8");
  return JSON.parse(raw) as StoredLead[];
}
