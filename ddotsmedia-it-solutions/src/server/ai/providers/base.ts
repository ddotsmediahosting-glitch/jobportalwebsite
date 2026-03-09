export interface ChatProvider {
  reply(prompt: string): Promise<string>;
}
