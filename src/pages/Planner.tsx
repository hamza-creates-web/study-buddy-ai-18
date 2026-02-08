import { useState } from "react";
import { subjects } from "@/lib/subjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

export default function Planner() {
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("3");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const generatePlan = async () => {
    if (!examDate || !dailyHours || selectedSubjects.length === 0) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    setPlan("");

    const subjectNames = subjects.filter((s) => selectedSubjects.includes(s.id)).map((s) => s.name);

    try {
      const { data, error } = await supabase.functions.invoke("study-ai", {
        body: {
          mode: "planner",
          messages: [{
            role: "user",
            content: `Create a study plan. Exam date: ${examDate}. Available study hours per day: ${dailyHours}. Subjects: ${subjectNames.join(", ")}.`,
          }],
        },
      });

      if (error) throw error;
      setPlan(data?.plan || "Failed to generate plan.");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Study Planner</h1>
      <p className="text-muted-foreground mb-6">Enter your exam date and available hours, and AI will generate a personalized daily study plan.</p>

      {!plan ? (
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Exam Date
              </label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Daily Study Hours
              </label>
              <Input type="number" min="1" max="12" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Subjects to Cover</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${selectedSubjects.includes(s.id) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}
                >
                  {selectedSubjects.includes(s.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generatePlan} disabled={loading || !examDate || selectedSubjects.length === 0} className="w-full gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Study Plan
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="outline" onClick={() => setPlan("")} className="mb-4">← Create New Plan</Button>
          <div className="bg-card rounded-xl border border-border p-6 prose-study text-sm">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
