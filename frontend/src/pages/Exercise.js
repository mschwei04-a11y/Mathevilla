import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, ArrowRight, CheckCircle, XCircle, 
  Lightbulb, Star, Trophy, Zap
} from 'lucide-react';

export default function Exercise() {
  const { grade, topic } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [correctTasks, setCorrectTasks] = useState(0);

  const decodedTopic = decodeURIComponent(topic);

  useEffect(() => {
    loadTasks();
  }, [grade, topic]);

  const loadTasks = async () => {
    try {
      const response = await api.getTasks(grade, decodedTopic);
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks[currentIndex];

  const handleSubmit = async () => {
    const submittedAnswer = currentTask.task_type === 'multiple_choice' ? selectedOption : answer;
    
    if (!submittedAnswer) {
      toast.error('Bitte gib eine Antwort ein');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.submitAnswer(currentTask.id, submittedAnswer);
      setResult(response.data);
      setSubmitted(true);
      setCompletedTasks(prev => prev + 1);

      if (response.data.is_correct) {
        setCorrectTasks(prev => prev + 1);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        if (response.data.level_up) {
          toast.success(`Level Up! Du bist jetzt Level ${user.level + 1}!`, {
            icon: <Trophy className="w-5 h-5 text-yellow-500" />
          });
        }
        
        if (response.data.new_badges?.length > 0) {
          response.data.new_badges.forEach(badge => {
            toast.success(`Neues Badge: ${badge}!`, {
              icon: <Star className="w-5 h-5 text-yellow-500" />
            });
          });
        }
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
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswer('');
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Keine Aufgaben verfügbar</h2>
            <p className="text-slate-600 mb-4">Für dieses Thema gibt es noch keine Aufgaben.</p>
            <Link to="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / tasks.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link to={`/topics/${grade}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900" data-testid="back-to-topics">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </Link>
            <h1 className="font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="topic-title">
              {decodedTopic}
            </h1>
            <span className="text-sm text-slate-500">
              {currentIndex + 1}/{tasks.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="exercise-card" data-testid="exercise-card">
              {/* Task Header */}
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyClass(currentTask.difficulty)}`}>
                  {currentTask.difficulty}
                </span>
                <div className="flex items-center gap-2 text-amber-500">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">+{currentTask.xp_reward} XP</span>
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed" data-testid="question-text">
                  {currentTask.question}
                </h2>
              </div>

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
                      {result.xp_earned > 0 && (
                        <p className="mt-2 text-emerald-600 font-semibold">
                          +{result.xp_earned} XP verdient!
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  data-testid="prev-btn"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>

                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || (!answer && !selectedOption)}
                    className="bg-emerald-500 hover:bg-emerald-600 px-8"
                    data-testid="submit-btn"
                  >
                    {submitting ? 'Wird geprüft...' : 'Antwort prüfen'}
                  </Button>
                ) : currentIndex < tasks.length - 1 ? (
                  <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 px-8" data-testid="next-btn">
                    Nächste Aufgabe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 px-8" data-testid="finish-btn">
                      <Trophy className="w-4 h-4 mr-2" />
                      Fertig!
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Session Stats */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Diese Sitzung: {correctTasks}/{completedTasks} richtig
        </div>
      </main>
    </div>
  );
}
