import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { subjects } from "@/lib/subjects";
import { streamChat, Msg } from "@/lib/streamChat";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Lightbulb, List, Globe, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const explainModes = [
  { id: "simple", label: "Simple", icon: Lightbulb, desc: "Easy to understand" },
  { id: "step-by-step", label: "Step by Step", icon: List, desc: "Detailed breakdown" },
  { id: "real-world", label: "Real World", icon: Globe, desc: "Practical examples" },
];

export default function Learn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubject = searchParams.get("subject") || "";
  const [selectedTopic, setSelectedTopic] = useState("");
  const [mode, setMode] = useState("simple");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const subject = subjects.find((s) => s.id === selectedSubject);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const askAI = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      mode,
      subject: subject?.name,
      topic: selectedTopic,
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        toast({ title: "AI Error", description: err, variant: "destructive" });
        setIsLoading(false);
      },
    });
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setMessages([]);
    askAI(`Explain "${topic}" in ${subject?.name || "Computer Science"}`);
  };

  if (!selectedSubject) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Choose a Subject to Learn</h1>
        <p className="text-muted-foreground mb-6">Select a subject and topic, then get AI-powered explanations.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSearchParams({ subject: s.id })}
              className="bg-card rounded-xl border border-border p-5 text-left card-hover"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{s.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.topics.length} topics</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => { setSearchParams({}); setMessages([]); }} className="text-sm text-muted-foreground hover:text-foreground mb-1">← All Subjects</button>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            {subject && <subject.icon className="w-5 h-5" style={{ color: subject.color }} />}
            {subject?.name}
          </h1>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {explainModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === m.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <m.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Topics sidebar */}
        <div className="w-48 shrink-0 hidden md:block overflow-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topics</h3>
          <div className="space-y-0.5">
            {subject?.topics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedTopic === topic ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-muted"}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-10 h-10 text-primary/40 mb-3" />
                <h3 className="font-display font-semibold text-foreground">Ready to learn!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Pick a topic from the sidebar or type a question below.
                </p>
                {/* Mobile topic chips */}
                <div className="flex flex-wrap gap-2 mt-4 md:hidden justify-center">
                  {subject?.topics.slice(0, 6).map((t) => (
                    <button key={t} onClick={() => handleTopicClick(t)} className="text-xs px-3 py-1.5 rounded-full bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose-study text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); askAI(input); }}
            className="border-t border-border p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this topic..."
              className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="gradient-primary text-primary-foreground shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
