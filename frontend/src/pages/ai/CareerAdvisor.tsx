import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bot, User, Send, Loader2, Sparkles, RefreshCw, Lightbulb, KeyRound } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_QUESTIONS = [
  'How do I negotiate salary in the UAE?',
  'What CV format works best for UAE employers?',
  'How do I transition into tech in Dubai?',
  'What are the top in-demand jobs in UAE right now?',
  'How do I prepare for a job interview in the UAE?',
  'What skills should I learn to advance my career?',
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-brand-600' : 'bg-gradient-to-br from-violet-600 to-indigo-600'}`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-brand-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        {message.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < message.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

export function CareerAdvisor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get('/ai/status').then((r) => r.data.data as { configured: boolean }),
    staleTime: 60_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
      setMessages(newMessages);
      const { data } = await api.post('/ai/career-chat', { messages: newMessages });
      return data.data.reply as string;
    },
    onSuccess: (reply) => {
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    },
    onError: (err) => {
      setMessages(prev => prev.slice(0, -1)); // remove optimistic user message
      toast.error(getApiError(err));
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setInput('');
    chatMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarter = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-800 to-blue-800 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-4">
            <Sparkles size={14} className="text-yellow-400" />
            Powered by Claude AI
          </div>
          <h1 className="text-3xl font-extrabold mb-2">AI Career Advisor</h1>
          <p className="text-indigo-200 text-base max-w-xl mx-auto">
            Your personal career coach for the UAE job market. Ask anything about job search,
            CV tips, interviews, salary, or career growth.
          </p>
          {!user && (
            <p className="mt-3 text-xs text-indigo-300">
              <Link to="/login" className="text-white underline">Sign in</Link> to get personalized advice based on your profile.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-4">
        {/* AI not configured banner */}
        {aiStatus && !aiStatus.configured && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <KeyRound size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold">AI Career Advisor is not configured</p>
              <p className="mt-0.5 text-amber-700">Add a valid <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the API container.</p>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '420px', maxHeight: '60vh' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot size={28} className="text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Hi! I'm your UAE Career Advisor</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Ask me anything about your career, job search, interviews, or the UAE job market.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
            )}
            {chatMutation.isPending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your career, CV, interviews, salary..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white p-2.5 rounded-xl disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {chatMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Starter questions */}
        {messages.length === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-amber-500" />
              <p className="text-xs font-medium text-gray-600">Try asking:</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleStarter(q)}
                  className="text-left text-xs text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="self-center flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw size={12} /> Start new conversation
          </button>
        )}
      </div>
    </div>
  );
}
