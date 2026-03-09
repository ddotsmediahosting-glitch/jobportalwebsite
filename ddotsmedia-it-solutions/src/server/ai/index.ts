import { MockChatProvider } from "@/server/ai/providers/mock-provider";
import { logEvent } from "@/server/logging/logger";

export async function generateChatReply(message: string) {
  const provider = new MockChatProvider();
  return provider.reply(message);
}

export async function qualifyLead(input: {
  serviceInterest: string;
  message: string;
}) {
  logEvent("info", "Lead qualification requested", input);

  return {
    category: input.serviceInterest,
    urgency: input.message.toLowerCase().includes("urgent") ? "high" : "normal",
    summary: "Scaffold response. AI provider integration will be expanded in the next phase.",
  };
}
