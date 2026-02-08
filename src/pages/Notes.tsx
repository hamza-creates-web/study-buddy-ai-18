import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

export default function Notes() {
  const [inputText, setInputText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateNotes = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setNotes("");

    try {
      const { data, error } = await supabase.functions.invoke("study-ai", {
        body: {
          mode: "notes",
          messages: [{ role: "user", content: inputText }],
        },
      });

      if (error) throw error;
      setNotes(data?.notes || "Failed to generate notes.");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Notes & Summary Generator</h1>
      <p className="text-muted-foreground mb-6">Paste your text or lecture content and let AI create clean study notes.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Input Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your lecture notes, textbook content, or any study material here..."
            className="w-full bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring min-h-[300px] resize-none"
          />
          <Button onClick={generateNotes} disabled={!inputText.trim() || loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Study Notes
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" /> Generated Notes
          </label>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[300px]">
            {notes ? (
              <div className="prose-study text-sm">
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <FileText className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Your notes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
