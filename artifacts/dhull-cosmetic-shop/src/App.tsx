import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ArrowUpRight, Clock3, MapPin, MessageCircle, Phone, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { shopData } from '@/config/shop-data';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';

type Role = 'user' | 'assistant';
type ChatMessage = { id: string; role: Role; content: string; createdAt: Date };
type QuickReply = { label: string; prompt: string };

const quickReplies: QuickReply[] = [
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

const initialMessage = (): ChatMessage => createMessage('assistant', shopData.welcomeMessage);

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#9d5666] text-[#fff9f6] shadow-[0_8px_18px_rgba(140,72,88,.2)]" aria-label="Dhull Cosmetic Shop mark">
      <span className="font-display text-[29px] font-semibold leading-none">D</span>
      <span className="absolute bottom-[8px] right-[9px] h-1.5 w-1.5 rounded-full bg-[#e8b4a9]" />
    </div>
  );
}

function Ornament({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute rounded-full border border-[#c57d89]/25 ${className}`}>
      <div className="absolute inset-[13%] rounded-full border border-[#c57d89]/20" />
    </div>
  );
}

function ShopDetails({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'items-center gap-3' : 'flex-col gap-3'}`}>
      <div className="flex items-center gap-2 text-[12px] text-[#795b63]">
        <MapPin size={14} strokeWidth={1.8} className="text-[#a75f70]" />
        <span data-testid="text-shop-location">{shopData.location}</span>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-[#795b63]">
        <Clock3 size={14} strokeWidth={1.8} className="text-[#a75f70]" />
        <span data-testid="text-shop-timing">{shopData.timing}</span>
      </div>
    </div>
  );
}

function FloatingEntry({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="button-open-chat"
      className="focus-ring entry-shadow group fixed bottom-5 right-5 z-20 flex w-[calc(100vw-40px)] max-w-[365px] items-center gap-3 rounded-[25px] border border-[#f3d9d3] bg-[#fffaf7]/95 p-3 text-left backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 active:translate-y-0 sm:bottom-8 sm:right-8"
    >
      <div className="relative">
        <LogoMark />
        <span className="pulse-ring absolute inset-0 rounded-[18px] border-2 border-[#bd7180]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="font-display text-[21px] font-semibold leading-none text-[#4f2937]">{shopData.name}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#6e9b7c]" />
        </div>
        <p className="truncate text-[12px] text-[#856870]">Ask us anything about your beauty routine</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2ddd7] text-[#9d5666] transition-colors group-hover:bg-[#9d5666] group-hover:text-[#fff9f6]">
        <MessageCircle size={17} />
      </div>
    </button>
  );
}

function BrandBackdrop({ onOpen }: { onOpen: () => void }) {
  return (
    <main className="shop-shell flex min-h-[100dvh] items-center">
      <Ornament className="right-[-115px] top-[-145px] h-[390px] w-[390px]" />
      <Ornament className="bottom-[-170px] left-[-115px] h-[360px] w-[360px]" />
      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-20 lg:px-16 lg:py-20">
        <section className="rise-in max-w-[590px]">
          <div className="mb-10 flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="font-display text-[25px] font-semibold tracking-[-.02em] text-[#4f2937]">{shopData.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-[.23em] text-[#a75f70]">Beauty, personally</div>
            </div>
          </div>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[.28em] text-[#a75f70]">A little care goes a long way</p>
          <h1 className="max-w-[550px] font-display text-[clamp(4.4rem,9vw,8.2rem)] font-semibold leading-[.79] tracking-[-.055em] text-[#4f2937]">
            Beauty that<br /><span className="italic text-[#b96e79]">feels like you.</span>
          </h1>
          <p className="mt-8 max-w-[440px] text-[15px] leading-7 text-[#795b63]">
            A warm, personal beauty desk from your neighbourhood shop. Tell us what you need — product suggestions, prices, a routine, or just a little guidance.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onOpen} data-testid="button-start-consultation" className="focus-ring group flex items-center gap-3 rounded-full bg-[#9d5666] px-5 py-3.5 text-[13px] font-semibold text-[#fff9f6] shadow-[0_12px_24px_rgba(157,86,102,.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Start a consultation
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d99597] transition-transform group-hover:rotate-45"><ArrowUpRight size={14} /></span>
            </button>
            <span className="text-[12px] text-[#92727a]">No appointment needed</span>
          </div>
          <div className="mt-14 border-t border-[#dfc9c4] pt-5"><ShopDetails /></div>
        </section>
        <section className="rise-in-delay relative mx-auto w-full max-w-[520px]">
          <div className="relative aspect-[.92] overflow-hidden rounded-[42%_42%_25%_25%/30%_30%_20%_20%] bg-[#eed9d2] shadow-[0_30px_80px_rgba(116,68,79,.16)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f8ece6,transparent_35%),linear-gradient(145deg,#e5bcb4,#f3ded5_52%,#c99091)]" />
            <div className="absolute left-[13%] top-[16%] h-[35%] w-[20%] rotate-[-21deg] rounded-[45%] bg-[#fbf1ea]/75 blur-[1px]" />
            <div className="absolute right-[13%] top-[28%] h-[42%] w-[27%] rotate-[26deg] rounded-[47%] bg-[#a75f70]/65" />
            <div className="absolute right-[16%] top-[32%] h-[35%] w-[20%] rotate-[26deg] rounded-[46%] border-[7px] border-[#f6e8df]/80" />
            <div className="absolute bottom-[10%] left-[22%] h-[33%] w-[26%] rotate-[-17deg] rounded-[38%_38%_15%_15%] bg-[#fff3eb]/80" />
            <div className="absolute bottom-[14%] left-[28%] h-[22%] w-[14%] rotate-[-17deg] rounded-[40%] bg-[#d4908b]" />
            <div className="absolute left-[9%] top-[55%] h-[16%] w-[13%] rotate-[23deg] rounded-full border-[12px] border-[#fff1e8]/70" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,247,239,.28)_41%,transparent_44%)]" />
          </div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl border border-[#f3d9d3] bg-[#fffaf7]/90 px-4 py-3 shadow-[0_16px_35px_rgba(116,68,79,.12)] backdrop-blur-sm sm:-left-8">
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#a75f70]">Local care,</p>
            <p className="font-display text-[23px] italic leading-none text-[#4f2937]">beautifully personal.</p>
          </div>
          <div className="drift absolute -right-1 top-7 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border border-[#fff8f2] bg-[#d9a08f] text-center text-[9px] uppercase leading-3 tracking-[.12em] text-[#fff8f2] shadow-lg sm:-right-5"><span>Ask<br />away</span></div>
        </section>
      </div>
      <FloatingEntry onOpen={onOpen} />
    </main>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" data-testid="status-assistant-typing">
      <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[#ead0ca] text-[#9d5666]"><Sparkles size={14} /></div>
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
      {isAssistant && <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#ead0ca] text-[#9d5666]"><Sparkles size={14} /></div>}
      <div className={`max-w-[83%] ${isAssistant ? 'rounded-[19px] rounded-bl-[5px] bg-[#f4e5df] text-[#57333e]' : 'rounded-[19px] rounded-br-[5px] bg-[#a85d6d] text-[#fffaf7]'} px-4 py-3`}>
        <p className="message-copy text-[13px] leading-[1.65]" data-testid={`text-message-${message.id}`}>{message.content}</p>
        <p className={`mt-1.5 text-right font-mono text-[8px] ${isAssistant ? 'text-[#a47b82]' : 'text-[#f3c9c8]'}`}>{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

function ChatWindow({ onClose }: { onClose: () => void }) {
  const savedMessages = useMemo<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('dhull-chat');
      if (!saved) return [initialMessage()];
      return (JSON.parse(saved) as Array<Omit<ChatMessage, 'createdAt'> & { createdAt: string }>).map((message) => ({ ...message, createdAt: new Date(message.createdAt) }));
    } catch {
      return [initialMessage()];
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

  const appendStream = useCallback(async (apiMessages: Array<{ role: Role; content: string }>, assistantId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: apiMessages }),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = `Chat request failed with ${response.status}`;
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the status-based message when the server does not return JSON.
      }
      throw new Error(message);
    }
    if (!response.body) throw new Error('No response stream received');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let received = '';
    const append = (value: string) => {
      received += value;
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: received } : message));
    };
    const consume = (line: string) => {
      const raw = line.startsWith('data:') ? line.slice(5).trimStart() : line;
      if (!raw || raw === '[DONE]') return;
      try {
        const parsed = JSON.parse(raw) as { content?: string; delta?: string; text?: string; choices?: Array<{ delta?: { content?: string } }> };
        append(parsed.content ?? parsed.delta ?? parsed.text ?? parsed.choices?.[0]?.delta?.content ?? '');
      } catch {
        append(raw);
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      lines.forEach(consume);
      if (done) break;
    }
    if (buffer.trim()) consume(buffer.trim());
    if (!received.trim()) throw new Error('The assistant returned an empty reply');
  }, []);

  const sendMessage = useCallback(async (text: string, appendUser = true) => {
    const cleanText = text.trim();
    if (!cleanText || isSending) return;
    setError(null);
    setLastFailedText('');
    const userMessage = appendUser ? createMessage('user', cleanText) : null;
    const assistantMessage = createMessage('assistant', '');
    const nextMessages = appendUser ? [...messages, userMessage!, assistantMessage] : [...messages, assistantMessage];
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
          : 'I could not reach the beauty desk right now. Please try once more.',
      );
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [appendStream, isSending, messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="mobile-chat-panel panel-shadow fixed bottom-5 right-5 z-30 flex h-[min(760px,calc(100dvh-40px))] w-[min(440px,calc(100vw-40px))] flex-col overflow-hidden rounded-[30px] border border-[#e5cfc9] bg-[#fffaf7] sm:bottom-8 sm:right-8">
      <header className="relative shrink-0 overflow-hidden bg-[#5b3542] px-5 pb-5 pt-5 text-[#fffaf7]">
        <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full border border-[#e7a7a4]/20" />
        <div className="absolute -right-1 -top-11 h-28 w-28 rounded-full border border-[#e7a7a4]/15" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#c87580] text-[#fffaf7]"><span className="font-display text-[27px] font-semibold">D</span></div>
            <div>
              <p className="font-display text-[25px] font-semibold leading-none" data-testid="text-chat-shop-name">{shopData.name}</p>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.16em] text-[#f0c6bd]"><span className="h-1.5 w-1.5 rounded-full bg-[#9bc09f]" />Online beauty desk</div>
            </div>
          </div>
          <button type="button" onClick={onClose} data-testid="button-close-chat" aria-label="Close chat" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-[#f5d1ca]/25 text-[#f5d1ca] transition-colors hover:bg-[#f5d1ca]/15"><X size={17} /></button>
        </div>
        <p className="relative mt-4 text-[12px] text-[#f1d9d2]">{shopData.tagline} <span className="mx-1 text-[#d79592]">·</span> {shopData.location}</p>
      </header>
      <div ref={scrollRef} className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fffaf7_0%,#fcf1ed_100%)] px-4 py-5 sm:px-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ead7d0]" />
          <span className="font-mono text-[8px] uppercase tracking-[.2em] text-[#b58a8b]">Today</span>
          <div className="h-px flex-1 bg-[#ead7d0]" />
        </div>
        <div className="space-y-4">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {isSending && <TypingIndicator />}
        </div>
        {messages.length === 1 && !isSending && (
          <div className="mt-6">
            <p className="mb-3 ml-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#b58a8b]">Start with a little prompt</p>
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.map((reply) => (
                <button type="button" key={reply.label} onClick={() => void sendMessage(reply.prompt)} data-testid={`button-quick-reply-${reply.label.toLowerCase().replaceAll(' ', '-')}`} className="focus-ring rounded-[14px] border border-[#ead4ce] bg-[#fffaf7] px-3 py-2.5 text-left text-[11px] font-medium text-[#754954] transition-all hover:-translate-y-0.5 hover:border-[#c47b85] hover:bg-[#f9e8e3] active:translate-y-0">
                  <span className="flex items-center justify-between gap-1">{reply.label}<ArrowUpRight size={12} className="text-[#b56b78]" /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-[15px] border border-[#e8bbb5] bg-[#fff0ed] p-3.5" role="alert" data-testid="status-chat-error">
            <p className="text-[12px] leading-5 text-[#9b4f58]">{error}</p>
            <button type="button" onClick={() => void sendMessage(lastFailedText, false)} data-testid="button-retry-chat" className="focus-ring mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#9b4f58] underline underline-offset-2"><RotateCcw size={12} /> Try again</button>
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-[#ead7d0] bg-[#fffaf7] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
        <a href={`https://wa.me/${shopData.whatsappNumber}`} target="_blank" rel="noreferrer" data-testid="link-whatsapp-order" className="mb-3 flex items-center justify-center gap-2 rounded-[13px] border border-[#c8ddca] bg-[#eef7ee] py-2.5 text-[11px] font-semibold text-[#4d795a] transition-colors hover:bg-[#e3f2e4]"><Phone size={13} /> Prefer WhatsApp? Order directly</a>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} disabled={isSending} data-testid="input-chat-message" aria-label="Write your message" placeholder="Ask in English, Hindi or Hinglish…" className="focus-ring min-w-0 flex-1 rounded-[15px] border border-[#ead7d0] bg-[#fffdfb] px-4 py-3 text-[12px] text-[#57333e] outline-none transition-colors placeholder:text-[#b89898] focus:border-[#c47b85] disabled:opacity-60" />
          <button type="submit" disabled={!input.trim() || isSending} data-testid="button-send-message" aria-label="Send message" className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#a85d6d] text-[#fffaf7] transition-all hover:bg-[#8e4b5c] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#e4c4c1]"><Send size={16} /></button>
        </form>
        <p className="mt-2 text-center font-mono text-[8px] tracking-[.08em] text-[#b79597]">Your conversation stays personal</p>
      </div>
    </div>
  );
}

function Home() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div data-testid="page-home">
      {!isOpen && <BrandBackdrop onOpen={() => setIsOpen(true)} />}
      {isOpen && <BrandBackdrop onOpen={() => setIsOpen(true)} />}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={window.location.pathname}>
      <Switch>
        <Route path="/" component={Home} />
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