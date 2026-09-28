import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Clock3, MapPin, MessageCircle, Phone, RotateCcw, Send, Sparkles } from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { shopData } from '@/config/shop-data';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';

type Role = 'user' | 'assistant';
type ApiMessage = { role: Role; content: string };
type ChatMessage = ApiMessage & { id: string; createdAt: Date };

const quickReplies: Array<{ label: string; prompt: string }> = [
  { label: 'Products', prompt: 'Mujhe aapke popular products ke baare mein bataiye.' },
  { label: 'Prices', prompt: 'Aapke products ke prices kya hain?' },
  { label: 'Skin Care Tips', prompt: 'Meri skin ke liye simple skincare tips dijiye.' },
  { label: 'Offers', prompt: 'Aaj ke offers aur deals kya chal rahe hain?' },
  { label: 'Shop Timing', prompt: 'Shop kitne baje open aur close hoti hai?' },
  { label: 'Contact', prompt: 'Mujhe shop se contact karna hai.' },
];

const createMessage = (role: Role, content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: new Date(),
});

const welcomeMessage = () => createMessage('assistant', shopData.welcomeMessage);

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" data-testid="status-assistant-typing">
      <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[#ead0ca] text-[#9d5666]">
        <Sparkles size={14} />
      </div>
      <div className="flex items-center gap-1 rounded-[17px] rounded-bl-[5px] bg-[#f4e5df] px-4 py-3">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#b56b78]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#b56b78]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#b56b78]" />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`rise-in flex ${isAssistant ? 'items-end' : 'justify-end'}`} data-testid={`message-${message.id}`}>
      {isAssistant && (
        <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#ead0ca] text-[#9d5666]">
          <Sparkles size={14} />
        </div>
      )}
      <div className={`max-w-[min(83%,620px)] ${isAssistant ? 'rounded-[19px] rounded-bl-[5px] bg-[#f4e5df] text-[#57333e]' : 'rounded-[19px] rounded-br-[5px] bg-[#a85d6d] text-[#fffaf7]'} px-4 py-3`}>
        <p className="message-copy whitespace-pre-wrap text-[13px] leading-[1.65]" data-testid={`text-message-${message.id}`}>
          {message.content}
        </p>
        <p className={`mt-1.5 text-right font-mono text-[8px] ${isAssistant ? 'text-[#a47b82]' : 'text-[#f3c9c8]'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ChatPage() {
  const savedMessages = useMemo<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('dhull-chat');
      if (!saved) return [welcomeMessage()];
      const parsed = JSON.parse(saved) as Array<Omit<ChatMessage, 'createdAt'> & { createdAt: string }>;
      if (!Array.isArray(parsed) || parsed.length === 0) return [welcomeMessage()];
      return parsed.map((message) => ({ ...message, createdAt: new Date(message.createdAt) }));
    } catch {
      return [welcomeMessage()];
    }
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(savedMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionStorage.setItem('dhull-chat', JSON.stringify(messages));
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [messages, isSending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const appendStream = useCallback(async (apiMessages: ApiMessage[], assistantId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: apiMessages.slice(-10) }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Chat request failed with ${response.status}`;
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the status-based message when the server response is not JSON.
      }
      throw new Error(message);
    }

    if (!response.body) throw new Error('No response stream received');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let received = '';

    const append = (value: string) => {
      if (!value) return;
      received += value;
      setMessages((current) =>
        current.map((message) => message.id === assistantId ? { ...message, content: received } : message),
      );
    };

    const consume = (line: string) => {
      const raw = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
      if (!raw || raw === '[DONE]') return;
      try {
        const parsed = JSON.parse(raw) as {
          content?: string;
          delta?: string;
          text?: string;
          choices?: Array<{ delta?: { content?: string } }>;
        };
        append(parsed.content ?? parsed.delta ?? parsed.text ?? parsed.choices?.[0]?.delta?.content ?? '');
      } catch {
        append(raw);
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        lines.forEach(consume);
        if (done) break;
      }
      if (buffer.trim()) consume(buffer);
    } finally {
      reader.releaseLock();
    }

    if (!received.trim()) throw new Error('The assistant returned an empty reply');
  }, []);

  const sendMessage = useCallback(async (text: string, appendUser = true) => {
    const cleanText = text.trim();
    if (!cleanText || isSending) return;

    setError(null);
    setLastFailedText('');
    const userMessage = appendUser ? createMessage('user', cleanText) : null;
    const assistantMessage = createMessage('assistant', '');
    const nextMessages = appendUser
      ? [...messages, userMessage!, assistantMessage]
      : [...messages, assistantMessage];

    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const apiMessages = nextMessages
        .filter((message) => message.content.trim())
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));
      await appendStream(apiMessages, assistantMessage.id);
    } catch (caughtError) {
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      setLastFailedText(cleanText);
      setError(
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : 'Chat service temporarily unavailable. Please try again.',
      );
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [appendStream, isSending, messages]);

  const clearChat = () => {
    abortRef.current?.abort();
    const fresh = [welcomeMessage()];
    setMessages(fresh);
    setInput('');
    setError(null);
    setLastFailedText('');
    sessionStorage.setItem('dhull-chat', JSON.stringify(fresh));
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <main className="min-h-[100dvh] bg-[#f8efeb] p-0 sm:p-5">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden border-[#e5cfc9] bg-[#fffaf7] shadow-[0_20px_70px_rgba(116,68,79,.12)] sm:min-h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border">
        <header className="relative shrink-0 overflow-hidden bg-[#5b3542] px-5 pb-5 pt-5 text-[#fffaf7] sm:px-7">
          <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full border border-[#e7a7a4]/20" />
          <div className="absolute -right-1 -top-11 h-28 w-28 rounded-full border border-[#e7a7a4]/15" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#c87580] text-[#fffaf7]">
                <span className="font-display text-[27px] font-semibold">D</span>
              </div>
              <div>
                <p className="font-display text-[25px] font-semibold leading-none" data-testid="text-chat-shop-name">{shopData.name}</p>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.16em] text-[#f0c6bd]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9bc09f]" />
                  Online beauty desk
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              data-testid="button-clear-chat"
              aria-label="Start a new chat"
              className="focus-ring flex h-9 items-center gap-1.5 rounded-full border border-[#f5d1ca]/25 px-3 text-[10px] font-semibold text-[#f5d1ca] transition-colors hover:bg-[#f5d1ca]/15"
            >
              <RotateCcw size={12} /> New chat
            </button>
          </div>
          <p className="relative mt-4 text-[12px] text-[#f1d9d2]">{shopData.tagline} <span className="mx-1 text-[#d79592]">·</span> {shopData.location}</p>
        </header>

        <div ref={scrollRef} className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fffaf7_0%,#fcf1ed_100%)] px-4 py-5 sm:px-7 sm:py-7">
          <div className="mx-auto mb-5 flex w-full max-w-[720px] items-center gap-3">
            <div className="h-px flex-1 bg-[#ead7d0]" />
            <span className="font-mono text-[8px] uppercase tracking-[.2em] text-[#b58a8b]">Today</span>
            <div className="h-px flex-1 bg-[#ead7d0]" />
          </div>
          <div className="mx-auto w-full max-w-[720px] space-y-4">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isSending && <TypingIndicator />}
          </div>

          {messages.length === 1 && !isSending && (
            <div className="mx-auto mt-6 w-full max-w-[720px]">
              <p className="mb-3 ml-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#b58a8b]">Start with a little prompt</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {quickReplies.map((reply) => (
                  <button
                    type="button"
                    key={reply.label}
                    onClick={() => void sendMessage(reply.prompt)}
                    data-testid={`button-quick-reply-${reply.label.toLowerCase().replaceAll(' ', '-')}`}
                    className="focus-ring rounded-[14px] border border-[#ead4ce] bg-[#fffaf7] px-3 py-2.5 text-left text-[11px] font-medium text-[#754954] transition-all hover:-translate-y-0.5 hover:border-[#c47b85] hover:bg-[#f9e8e3] active:translate-y-0"
                  >
                    <span className="flex items-center justify-between gap-1">{reply.label}<ArrowUpRight size={12} className="text-[#b56b78]" /></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto mt-5 w-full max-w-[720px] rounded-[15px] border border-[#e8bbb5] bg-[#fff0ed] p-3.5" role="alert" data-testid="status-chat-error">
              <p className="text-[12px] leading-5 text-[#9b4f58]">{error}</p>
              <button type="button" onClick={() => void sendMessage(lastFailedText, false)} data-testid="button-retry-chat" className="focus-ring mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#9b4f58] underline underline-offset-2">
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#ead7d0] bg-[#fffaf7] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:px-7">
          <div className="mx-auto w-full max-w-[720px]">
            <a href={`https://wa.me/${shopData.whatsappNumber}`} target="_blank" rel="noreferrer" data-testid="link-whatsapp-order" className="mb-3 flex items-center justify-center gap-2 rounded-[13px] border border-[#c8ddca] bg-[#eef7ee] py-2.5 text-[11px] font-semibold text-[#4d795a] transition-colors hover:bg-[#e3f2e4]">
              <Phone size={13} /> Prefer WhatsApp? Order directly
            </a>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} disabled={isSending} data-testid="input-chat-message" aria-label="Write your message" placeholder="Ask in English, Hindi or Hinglish…" className="focus-ring min-w-0 flex-1 rounded-[15px] border border-[#ead7d0] bg-[#fffdfb] px-4 py-3 text-[12px] text-[#57333e] outline-none transition-colors placeholder:text-[#b89898] focus:border-[#c47b85] disabled:opacity-60" />
              <button type="submit" disabled={!input.trim() || isSending} data-testid="button-send-message" aria-label="Send message" className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#a85d6d] text-[#fffaf7] transition-all hover:bg-[#8e4b5c] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#e4c4c1]">
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 text-center font-mono text-[8px] tracking-[.08em] text-[#b79597]">Your conversation stays personal</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={window.location.pathname}>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}