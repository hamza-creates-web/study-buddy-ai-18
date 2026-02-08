import { useNavigate } from "react-router-dom";
import { subjects } from "@/lib/subjects";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Brain, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";

  const quickActions = [
    { title: "Learn a Topic", icon: BookOpen, desc: "AI explanations", path: "/learn", color: "bg-primary/10 text-primary" },
    { title: "Practice", icon: Brain, desc: "Quizzes & problems", path: "/practice", color: "bg-info/10 text-info" },
    { title: "Study Plan", icon: Calendar, desc: "Plan your schedule", path: "/planner", color: "bg-accent/10 text-accent-foreground" },
    { title: "Progress", icon: TrendingUp, desc: "Track your learning", path: "/progress", color: "bg-success/10 text-success" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="rounded-2xl gradient-hero p-6 md:p-8 text-primary-foreground">
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="mt-2 opacity-90 text-sm md:text-base max-w-lg">
          Ready to level up your CS knowledge? Pick a subject below or jump into a quick practice session.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className="bg-card rounded-xl border border-border p-4 text-left card-hover group"
          >
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Subjects */}
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Choose a Subject</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => navigate(`/learn?subject=${subject.id}`)}
              className="bg-card rounded-xl border border-border p-5 text-left card-hover group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                >
                  <subject.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-foreground">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subject.description}</p>
                  <p className="text-xs text-primary font-medium mt-2">{subject.topics.length} topics →</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
