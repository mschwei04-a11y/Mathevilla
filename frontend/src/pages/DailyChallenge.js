import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { 
  ArrowLeft, Flame, CheckCircle, XCircle, 
  Star, Trophy, Zap, Gift
} from 'lucide-react';

export default function DailyChallenge() {
  const { user, refreshUser } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    try {
      const response = await api.getDailyChallenge();
      setChallenge(response.data);
    } catch (error) {
      console.error('Error loading challenge:', error);
      toast.error('Fehler beim Laden der Challenge');
    } finally {
      setLoading(false);
    }
  };

  const currentTask = challenge?.tasks?.[currentIndex];

  const handleSubmit = async () => {
    const submittedAnswer = currentTask.task_type === 'multiple_choice' ? selectedOption : answer;
    
    if (!submittedAnswer) {
      toast.error('Bitte gib eine Antwort ein');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.submitChallengeAnswer(challenge.id, currentTask.id, submittedAnswer);
      setResult(response.data);
      setSubmitted(true);
      setCompletedTaskIds(prev => [...prev, currentTask.id]);

      if (response.data.is_correct) {
        playSound('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        playSound('error');
      }

      if (response.data.challenge_completed && response.data.bonus_xp_awarded) {
        setTimeout(() => playSound('levelUp'), 500);
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 }
        });
        toast.success('Challenge abgeschlossen! +50 Bonus-XP!', {
          icon: <Gift className="w-5 h-5 text-orange-500" />
        });
      }
      
      refreshUser();
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Fehler beim Senden der Antwort');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < challenge.tasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswer('');
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
    }
  };

  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'leicht': return 'difficulty-leicht';
      case 'mittel': return 'difficulty-mittel';
      case 'schwer': return 'difficulty-schwer';
      default: return 'difficulty-mittel';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!challenge || challenge.tasks.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Flame className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Keine Challenge verfügbar</h2>
            <p className="text-slate-600 mb-4">Komm morgen wieder für eine neue Challenge!</p>
            <Link to="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (challenge.completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>
              Challenge abgeschlossen!
            </h2>
            <p className="text-slate-600 mb-6">
              Du hast die heutige Challenge bereits gemeistert. Komm morgen wieder!
            </p>
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-6">
              <Star className="w-6 h-6" />
              <span className="text-xl font-bold">+50 Bonus-XP</span>
            </div>
            <Link to="/dashboard">
              <Button className="w-full bg-orange-500 hover:bg-orange-600" data-testid="back-to-dashboard">
                Zurück zum Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / challenge.tasks.length) * 100;
  const isLastTask = currentIndex === challenge.tasks.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-amber-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-orange-100" data-testid="back-to-dashboard">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </Link>
            <div className="flex items-center gap-2 text-white">
              <Flame className="w-6 h-6" />
              <h1 className="font-bold" style={{ fontFamily: 'Manrope' }}>Tägliche Challenge</h1>
            </div>
            <div className="flex items-center gap-2">
              <SoundControls />
              <span className="text-white text-sm">
                {currentIndex + 1}/{challenge.tasks.length}
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-2xl" data-testid="challenge-card">
            <CardContent className="p-6 sm:p-8">
              {/* Task Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyClass(currentTask.difficulty)}`}>
                    {currentTask.difficulty}
                  </span>
                  <span className="text-sm text-slate-500">Klasse {currentTask.grade}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-500">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">+{currentTask.xp_reward} XP</span>
                </div>
              </div>

              {/* Topic */}
              <p className="text-sm text-slate-500 mb-2">{currentTask.topic}</p>

              {/* Question */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed mb-8" data-testid="question-text">
                {currentTask.question}
              </h2>

              {/* Answer Section */}
              <div className="mb-8">
                {currentTask.task_type === 'multiple_choice' ? (
                  <div className="space-y-3">
                    {currentTask.options?.map((option, idx) => {
                      let buttonClass = 'option-btn';
                      if (submitted) {
                        if (option === result.correct_answer) {
                          buttonClass = 'option-btn correct';
                        } else if (option === selectedOption && !result.is_correct) {
                          buttonClass = 'option-btn wrong';
                        }
                      } else if (selectedOption === option) {
                        buttonClass = 'option-btn selected';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => !submitted && setSelectedOption(option)}
                          className={buttonClass}
                          disabled={submitted}
                          data-testid={`option-${idx}`}
                        >
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 mr-4 text-sm font-bold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Deine Antwort..."
                      className={`h-14 text-lg px-6 ${submitted ? (result.is_correct ? 'answer-correct' : 'answer-wrong') : ''}`}
                      disabled={submitted}
                      onKeyPress={(e) => e.key === 'Enter' && !submitted && handleSubmit()}
                      data-testid="answer-input"
                    />
                    {submitted && !result.is_correct && (
                      <p className="mt-2 text-sm text-slate-600">
                        Richtige Antwort: <strong className="text-emerald-600">{result.correct_answer}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Result Feedback */}
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-xl mb-6 ${result.is_correct ? 'bg-emerald-50' : 'bg-red-50'}`}
                  data-testid="result-feedback"
                >
                  <div className="flex items-start gap-4">
                    {result.is_correct ? (
                      <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg mb-2 ${result.is_correct ? 'text-emerald-800' : 'text-red-800'}`}>
                        {result.is_correct ? 'Richtig!' : 'Leider falsch'}
                      </h3>
                      <p className="text-slate-700">{currentTask.explanation}</p>
                      {result.tasks_remaining > 0 && (
                        <p className="mt-2 text-slate-500 text-sm">
                          Noch {result.tasks_remaining} Aufgaben in dieser Challenge
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {completedTaskIds.length}/{challenge.tasks.length} bearbeitet
                </div>

                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || (!answer && !selectedOption)}
                    className="bg-orange-500 hover:bg-orange-600 px-8"
                    data-testid="submit-btn"
                  >
                    {submitting ? 'Wird geprüft...' : 'Antwort prüfen'}
                  </Button>
                ) : !isLastTask ? (
                  <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 px-8" data-testid="next-btn">
                    Nächste Aufgabe
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button className="bg-orange-500 hover:bg-orange-600 px-8" data-testid="finish-btn">
                      <Trophy className="w-4 h-4 mr-2" />
                      Challenge beenden
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bonus Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full">
            <Gift className="w-5 h-5" />
            <span className="font-medium">+{challenge.bonus_xp} Bonus-XP bei Abschluss</span>
          </div>
        </div>
      </main>
    </div>
  );
}
