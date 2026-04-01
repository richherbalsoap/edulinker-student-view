import { useState, useEffect, useRef, useMemo } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { supabase } from '@/integrations/supabase/client';
import { applyCreatedAtFilter, applySchoolScopeFilter } from '@/lib/queryFilters';
import { Bot, Send, User } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const AIInsightPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const [results, setResults] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hello! I'm your Academic Insight Assistant. Ask me about your overall performance, specific subjects, weak areas, or improvement tips." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!student) return;
    const fetch = async () => {
      let query = supabase
        .from('results')
        .select('*')
        .eq('student_id', student.id);

      query = applySchoolScopeFilter(query, schoolId, filterType === 'all');
      query = applyCreatedAtFilter(query, filterType, startDate, endDate);

      const { data } = await query;
      setResults(data || []);
    };
    fetch();
  }, [student, schoolId, filterType, startDate, endDate]);

  const analytics = useMemo(() => {
    if (results.length === 0) return null;
    const subjectMap: Record<string, { total: number; count: number }> = {};
    results.forEach(r => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 };
      subjectMap[r.subject].total += r.percentage || 0;
      subjectMap[r.subject].count += 1;
    });
    const subjects = Object.entries(subjectMap).map(([name, d]) => ({
      name,
      avg: Math.round(d.total / d.count),
    }));
    const overall = Math.round(subjects.reduce((s, x) => s + x.avg, 0) / subjects.length);
    const best = subjects.reduce((b, s) => s.avg > b.avg ? s : b);
    const worst = subjects.reduce((w, s) => s.avg < w.avg ? s : w);
    return { subjects, overall, best, worst };
  }, [results]);

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (!analytics) return "I don't have enough data to analyze yet. Please check back once your results are available.";

    // Overall performance
    if (q.includes('overall') || q.includes('performance') || q.includes('average')) {
      if (analytics.overall >= 90) return `🌟 Outstanding! Your overall average is ${analytics.overall}%. You're performing exceptionally well across all subjects. Keep maintaining this excellence!`;
      if (analytics.overall >= 75) return `✨ Excellent academic consistency! Your overall average is ${analytics.overall}%. You're doing great. Focus on pushing your weaker subjects to reach the 90%+ zone.`;
      if (analytics.overall >= 50) return `📊 Your overall average is ${analytics.overall}%. There's room for improvement. Consider dedicating more time to ${analytics.worst.name} (${analytics.worst.avg}%) to boost your overall score.`;
      return `⚠️ Your overall average is ${analytics.overall}%. This needs attention. I recommend focusing on ${analytics.worst.name} first, and seeking help from your teachers.`;
    }

    // Specific subject
    for (const sub of analytics.subjects) {
      if (q.includes(sub.name.toLowerCase())) {
        if (sub.avg >= 90) return `🏆 Your performance in ${sub.name} is excellent at ${sub.avg}%! You're among the top performers.`;
        if (sub.avg >= 75) return `👍 Good work in ${sub.name}! Your average is ${sub.avg}%. With a bit more effort, you can push it to 90%+.`;
        if (sub.avg >= 50) return `📝 Your ${sub.name} average is ${sub.avg}%. This is passable, but I'd recommend regular practice and revision to improve.`;
        return `⚠️ Your performance in ${sub.name} needs improvement at ${sub.avg}%. Consider extra study sessions, practice problems, and don't hesitate to ask your teacher for help.`;
      }
    }

    // Weak subject
    if (q.includes('weak') || q.includes('worst') || q.includes('low')) {
      return `📉 Your weakest subject is ${analytics.worst.name} with an average of ${analytics.worst.avg}%. Focus on: 1) Regular practice 2) Reviewing fundamentals 3) Seeking teacher guidance. Small consistent improvements will make a big difference!`;
    }

    // Best subject
    if (q.includes('best') || q.includes('strong') || q.includes('top')) {
      return `🏆 Your strongest subject is ${analytics.best.name} with an average of ${analytics.best.avg}%! Keep up the excellent work and consider helping classmates who struggle with this subject.`;
    }

    // Improvement
    if (q.includes('improve') || q.includes('tips') || q.includes('suggestion') || q.includes('help')) {
      const weakSubs = analytics.subjects.filter(s => s.avg < 60);
      if (weakSubs.length === 0) return `💡 You're doing well overall (${analytics.overall}%)! To improve further: 1) Challenge yourself with advanced problems 2) Maintain consistency 3) Focus on time management during exams.`;
      return `💡 Improvement suggestions:\n${weakSubs.map(s => `• ${s.name} (${s.avg}%): Needs more practice and revision`).join('\n')}\n\nGeneral tips: Set a daily study schedule, practice previous year questions, and review mistakes regularly.`;
    }

    // Subjects list
    if (q.includes('subject') || q.includes('all') || q.includes('list')) {
      return `📚 Your subject-wise performance:\n${analytics.subjects.map(s => `• ${s.name}: ${s.avg}%`).join('\n')}\n\nOverall average: ${analytics.overall}%`;
    }

    return `I can help you with:\n• "overall performance" — Your academic overview\n• "[subject name] result" — Specific subject analysis\n• "weak subject" — Identify areas needing improvement\n• "best subject" — Your strongest area\n• "improvement tips" — Personalized suggestions\n\nTry asking one of these!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateResponse(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setTyping(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  return (
    <div className="relative z-10 px-4 py-6 h-[calc(100vh-60px)] flex flex-col">
      <h1 className="text-3xl font-bold text-foreground text-center mb-4">AI Insight</h1>

      <div className="flex-1 bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card/50 border border-primary/10 text-foreground rounded-bl-md'
              }`}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <User size={16} className="text-primary" />
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="bg-card/50 border border-primary/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-primary/20 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your performance..."
              className="flex-1 px-4 py-3 bg-background/30 border border-primary/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIInsightPage;
