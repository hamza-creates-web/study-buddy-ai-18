import { useEffect, useState } from "react";
import { subjects } from "@/lib/subjects";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, Target } from "lucide-react";

interface TopicProgress {
  subject: string;
  topic: string;
  status: string;
  correct_answers: number;
  total_questions: number;
}

export default function Progress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("topic_progress")
      .select("subject, topic, status, correct_answers, total_questions")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setProgress(data || []);
        setLoading(false);
      });
  }, [user]);

  const getSubjectProgress = (subjectId: string) => {
    const subjectTopics = progress.filter((p) => p.subject === subjectId);
    const subject = subjects.find((s) => s.id === subjectId);
    const total = subject?.topics.length || 0;
    const completed = subjectTopics.filter((t) => t.status === "completed").length;
    const inProgress = subjectTopics.filter((t) => t.status === "in_progress").length;
    const totalQ = subjectTopics.reduce((a, b) => a + (b.total_questions || 0), 0);
    const correctQ = subjectTopics.reduce((a, b) => a + (b.correct_answers || 0), 0);
    return { total, completed, inProgress, totalQ, correctQ, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const totalCompleted = progress.filter((p) => p.status === "completed").length;
  const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
  const totalQ = progress.reduce((a, b) => a + (b.total_questions || 0), 0);
  const totalCorrect = progress.reduce((a, b) => a + (b.correct_answers || 0), 0);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Your Progress</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Topics Completed</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalCompleted}<span className="text-base text-muted-foreground font-normal">/{totalTopics}</span></p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Questions Attempted</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalQ}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Accuracy</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0}%</p>
        </div>
      </div>

      {/* Subject breakdown */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">Subject Breakdown</h2>
      <div className="space-y-4">
        {subjects.map((s) => {
          const prog = getSubjectProgress(s.id);
          return (
            <div key={s.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{prog.completed} of {prog.total} topics completed</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">{prog.pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${prog.pct}%`, background: s.color }} />
              </div>
              {prog.totalQ > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {prog.correctQ}/{prog.totalQ} questions correct ({prog.totalQ > 0 ? Math.round((prog.correctQ / prog.totalQ) * 100) : 0}% accuracy)
                </p>
              )}
            </div>
          );
        })}
      </div>

      {progress.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No progress recorded yet. Start learning and practicing to track your progress!</p>
        </div>
      )}
    </div>
  );
}
