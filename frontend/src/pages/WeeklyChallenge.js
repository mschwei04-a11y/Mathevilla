import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import SoundControls from '../components/SoundControls';
import MathIcon from '../components/MathIcon';
import { 
  ArrowLeft, Calendar, CheckCircle, XCircle, 
  Star, Trophy, Gift, Clock
} from 'lucide-react';

export default function WeeklyChallenge() {
  const { user, refreshUser } = useAuth();
  const { playSound } = useSound();
  const [challenge, setChallenge] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    try {
      const response = await api.getWeeklyChallenge();
      setChallenge(response.data);
      // Find first uncompleted task
      const completedIds = response.data.completed_task_ids || [];
      const firstIncomplete = response.data.tasks?.findIndex(t => !completedIds.includes(t.id));
      setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    } catch (error) {
      toast.error('Fehler beim Laden der Weekly Challenge');
    } finally {
      setLoading(false);
    }
  };

  const currentTask = challenge?.tasks?.[currentIndex];
  const isTaskCompleted = challenge?.completed_task_ids?.includes(currentTask?.id);
  const progressPercent = challenge ? (challenge.completed_task_ids?.length / challenge.tasks?.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!answer.trim() || !currentTask) return;

    try {
      const response = await api.submitWeeklyChallengeAnswer(currentTask.id, answer);
      setResult(response.data);

      if (response.data.is_correct) {
        playSound('success');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        
        if (response.data.challenge_completed) {
          playSound('levelUp');
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
          toast.success('🎉 Weekly Challenge geschafft! +100 Bonus-XP!');
        }
        
        // Update local state
        setChallenge(prev => ({
          ...prev,
          completed_task_ids: [...(prev.completed_task_ids || []), currentTask.id],
          completed: response.data.challenge_completed
        }));
      } else {
        playSound('error');
      }

      await refreshUser();
    } catch (error) {
      toast.error('Fehler beim Senden der Antwort');
    }
  };

  const handleNext = () => {
    if (currentIndex < challenge.tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setResult(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswer('');
      setResult(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (challenge?.completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-600 to-teal-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Weekly Challenge geschafft! 🎉</h1>
          <p className="text-emerald-100 mb-2">Du hast alle 5 Aufgaben gelöst!</p>
          <p className="text-emerald-200 mb-8">+100 Bonus-XP verdient</p>
          <Link to="/dashboard">
            <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
              Zurück zum Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700">
      {/* Header */}
      <div className="bg-purple-700/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-purple-200">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </Link>
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-6 h-6" />
              <h1 className="font-bold" style={{ fontFamily: 'Nunito' }}>Weekly Challenge</h1>
            </div>
            <div className="flex items-center gap-2">
              <SoundControls />
              <span className="text-white text-sm">
                {currentIndex + 1}/{challenge?.tasks?.length || 0}
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 bg-purple-400" />
        </div>
      </div>

      {/* Bonus Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 py-3">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-3">
          <Gift className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">
            Löse alle 5 Aufgaben und erhalte +{challenge?.bonus_xp || 100} Bonus-XP!
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentTask && (
          <motion.div
            key={currentTask.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8">
                {/* Task Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {currentTask.topic}
                  </span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-slate-600">+{currentTask.xp_reward} XP</span>
                  </div>
                </div>

                {/* Question */}
                <h2 className="text-2xl font-bold text-slate-900 mb-8">
                  {currentTask.question}
                </h2>

                {/* Answer Input or Multiple Choice */}
                {!result ? (
                  <>
                    {currentTask.task_type === 'multiple_choice' ? (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {currentTask.options?.map((option, i) => (
                          <Button
                            key={i}
                            variant={answer === option ? "default" : "outline"}
                            className={`h-16 text-lg ${answer === option ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                            onClick={() => setAnswer(option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-6">
                        <Input
                          type="text"
                          placeholder="Deine Antwort..."
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          className="h-14 text-lg text-center border-2 border-purple-200 focus:border-purple-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                          disabled={isTaskCompleted}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleSubmit}
                      className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
                      disabled={!answer.trim() || isTaskCompleted}
                    >
                      {isTaskCompleted ? 'Bereits gelöst ✓' : 'Antwort prüfen'}
                    </Button>
                  </>
                ) : (
                  /* Result Display */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className={`p-6 rounded-xl mb-6 ${
                      result.is_correct 
                        ? 'bg-emerald-50 border-2 border-emerald-200' 
                        : 'bg-red-50 border-2 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        {result.is_correct ? (
                          <>
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                            <span className="text-xl font-bold text-emerald-700">Richtig!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-8 h-8 text-red-500" />
                            <span className="text-xl font-bold text-red-700">Leider falsch</span>
                          </>
                        )}
                      </div>
                      {!result.is_correct && (
                        <p className="text-slate-700 mb-2">
                          Richtige Antwort: <span className="font-bold text-emerald-600">{result.correct_answer}</span>
                        </p>
                      )}
                      <p className="text-slate-600">{result.explanation}</p>
                      <p className="text-sm text-purple-600 mt-3">
                        Fortschritt: {result.progress}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="flex-1"
                      >
                        Vorherige
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={currentIndex === challenge.tasks.length - 1}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Nächste Aufgabe
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Progress Overview */}
        <div className="mt-8 flex justify-center gap-2">
          {challenge?.tasks?.map((task, i) => (
            <button
              key={task.id}
              onClick={() => { setCurrentIndex(i); setAnswer(''); setResult(null); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                challenge.completed_task_ids?.includes(task.id)
                  ? 'bg-emerald-500 text-white'
                  : i === currentIndex
                    ? 'bg-white text-purple-600 ring-2 ring-purple-400'
                    : 'bg-white/30 text-white hover:bg-white/50'
              }`}
            >
              {challenge.completed_task_ids?.includes(task.id) ? '✓' : i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
