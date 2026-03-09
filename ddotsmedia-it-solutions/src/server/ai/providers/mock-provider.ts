import type { ChatProvider } from "@/server/ai/providers/base";

export class MockChatProvider implements ChatProvider {
  async reply(prompt: string) {
    return `Mock AI reply: ${prompt.slice(0, 140)}`;
  }
}
