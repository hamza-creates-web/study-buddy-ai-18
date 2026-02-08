import { useState } from "react";
import { subjects } from "@/lib/subjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "mcq" | "short" | "long";

interface Question {
  question: string;
  type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export default function Practice() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const subject = subjects.find((s) => s.id === selectedSubject);
  const currentQ = questions[currentIdx];

  const generateQuestions = async () => {
    if (!selectedSubject || !selectedTopic) return;
    setLoading(true);
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);

    try {
      const { data, error } = await supabase.functions.invoke("study-ai", {
        body: {
          mode: "quiz",
          subject: subject?.name,
          topic: selectedTopic,
          difficulty,
          questionType,
          messages: [{ role: "user", content: `Generate quiz for ${selectedTopic}` }],
        },
      });

      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
      } else {
        toast({ title: "Failed to generate questions", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    const isCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
    if (isCorrect) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    setSelectedAnswer("");
    setShowResult(false);
    setCurrentIdx((i) => i + 1);
  };

  if (!selectedSubject) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Practice Zone</h1>
        <p className="text-muted-foreground mb-6">Test your knowledge with AI-generated questions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setSelectedSubject(s.id)} className="bg-card rounded-xl border border-border p-5 text-left card-hover">
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

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => { setSelectedSubject(""); setSelectedTopic(""); }} className="text-sm text-muted-foreground hover:text-foreground mb-4">← Back</button>
        <h1 className="font-display text-xl font-bold text-foreground mb-6">Configure Practice — {subject?.name}</h1>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Topic</label>
            <div className="flex flex-wrap gap-2">
              {subject?.topics.map((t) => (
                <button key={t} onClick={() => setSelectedTopic(t)} className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${selectedTopic === t ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={`text-sm px-4 py-2 rounded-lg border capitalize transition-colors ${difficulty === d ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Question Type</label>
            <div className="flex gap-2">
              {([["mcq", "Multiple Choice"], ["short", "Short Answer"], ["long", "Long Answer"]] as [QuestionType, string][]).map(([t, label]) => (
                <button key={t} onClick={() => setQuestionType(t)} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${questionType === t ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateQuestions} disabled={!selectedTopic || loading} className="gradient-primary text-primary-foreground w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generate Questions
          </Button>
        </div>
      </div>
    );
  }

  if (currentIdx >= questions.length) {
    return (
      <div className="max-w-lg mx-auto text-center animate-fade-in py-12">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Practice Complete!</h2>
        <p className="text-muted-foreground mt-2">You scored {score} out of {questions.length}</p>
        <div className="w-full bg-muted rounded-full h-3 mt-4 mb-6">
          <div className="h-3 rounded-full gradient-primary transition-all" style={{ width: `${(score / questions.length) * 100}%` }} />
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setQuestions([]); setCurrentIdx(0); setScore(0); }}>
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Button onClick={() => { setSelectedSubject(""); setSelectedTopic(""); setQuestions([]); setCurrentIdx(0); setScore(0); }} className="gradient-primary text-primary-foreground">
            New Subject
          </Button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-sm font-medium text-primary">Score: {score}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mb-6">
        <div className="h-1.5 rounded-full gradient-primary transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground text-lg mb-4">{currentQ.question}</h3>

        {currentQ.type === "mcq" && currentQ.options ? (
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedAnswer === letter;
              const isCorrectOpt = showResult && letter === currentQ.correct_answer.trim().toUpperCase();
              const isWrongOpt = showResult && isSelected && !isCorrect;
              return (
                <button
                  key={i}
                  onClick={() => !showResult && setSelectedAnswer(letter)}
                  disabled={showResult}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${isCorrectOpt ? "border-success bg-success/10 text-success" : isWrongOpt ? "border-destructive bg-destructive/10 text-destructive" : isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <span className="font-medium mr-2">{letter}.</span> {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer..."
            className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
          />
        )}

        {showResult && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
              <span className="text-sm font-medium">{isCorrect ? "Correct!" : `Incorrect — Answer: ${currentQ.correct_answer}`}</span>
            </div>
            <div className="prose-study text-sm">
              <ReactMarkdown>{currentQ.explanation}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4 gap-2">
          {!showResult ? (
            <Button onClick={checkAnswer} disabled={!selectedAnswer} className="gradient-primary text-primary-foreground">Check Answer</Button>
          ) : (
            <Button onClick={nextQuestion} className="gradient-primary text-primary-foreground">
              {currentIdx < questions.length - 1 ? <>Next <ArrowRight className="w-4 h-4 ml-1" /></> : "See Results"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
