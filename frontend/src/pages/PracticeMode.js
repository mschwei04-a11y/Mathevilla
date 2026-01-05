import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import SoundControls from '../components/SoundControls';
import { 
  ArrowLeft, ArrowRight, CheckCircle, XCircle, 
  Lightbulb, BookOpen, RefreshCw, Brain
} from 'lucide-react';

export default function PracticeMode() {
  const { grade, topic } = useParams();
  const { user } = useAuth();
  const { playSound } = useSound();
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, total: 0 });
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const decodedTopic = decodeURIComponent(topic);

  useEffect(() => {
    loadTasks();
  }, [grade, topic]);

  const loadTasks = async () => {
    try {
      const response = await api.getTasks(grade, decodedTopic);
      // Shuffle tasks for practice
      const shuffled = [...response.data].sort(() => Math.random() - 0.5);
      setTasks(shuffled);
    } catch (error) {
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks[currentIndex];
  const progressPercent = tasks.length > 0 ? ((currentIndex + 1) / tasks.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    try {
      const response = await api.submitPracticeAnswer(currentTask.id, answer);
      setResult(response.data);
      
      setPracticeStats(prev => ({
        correct: prev.correct + (response.data.is_correct ? 1 : 0),
        total: prev.total + 1
      }));

      if (response.data.is_correct) {
        playSound('success');
      } else {
        playSound('error');
      }
    } catch (error) {
      toast.error('Fehler beim Prüfen der Antwort');
    }
  };

  const handleExplainMistake = async () => {
    if (!result || result.is_correct) return;
    
    setLoadingExplanation(true);
    try {
      const response = await api.explainMistake(currentTask.id, answer);
      setExplanation(response.data);
    } catch (error) {
      toast.error('KI-Erklärung nicht verfügbar');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setResult(null);
      setExplanation(null);
    }
  };

  const handleRetry = () => {
    setAnswer('');
    setResult(null);
    setExplanation(null);
  };

  const handleShuffle = () => {
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    setTasks(shuffled);
    setCurrentIndex(0);
    setAnswer('');
    setResult(null);
    setExplanation(null);
    setPracticeStats({ correct: 0, total: 0 });
    toast.success('Aufgaben neu gemischt!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link to={`/topics/${grade}`} className="flex items-center gap-2 hover:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <h1 className="font-bold" style={{ fontFamily: 'Nunito' }}>
                Übungsmodus
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <SoundControls />
              <span className="text-sm opacity-80">
                {currentIndex + 1}/{tasks.length}
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Practice Mode Banner */}
      <div className="bg-emerald-500 py-2">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-3">
          <Brain className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">
            Übungsmodus aktiv – Kein Druck, keine XP, nur Lernen!
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              <span className="font-bold text-emerald-600">{practiceStats.correct}</span> richtig
            </span>
            <span className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">{practiceStats.total}</span> beantwortet
            </span>
            {practiceStats.total > 0 && (
              <span className="text-sm text-slate-600">
                <span className="font-bold text-blue-600">
                  {Math.round((practiceStats.correct / practiceStats.total) * 100)}%
                </span> Quote
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleShuffle}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Mischen
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentTask && (
            <motion.div
              key={currentTask.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  {/* Topic & Difficulty */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                      {decodedTopic}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentTask.difficulty === 'leicht' ? 'bg-emerald-100 text-emerald-700' :
                      currentTask.difficulty === 'mittel' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentTask.difficulty}
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8">
                    {currentTask.question}
                  </h2>

                  {/* Answer Input */}
                  {!result ? (
                    <>
                      {currentTask.task_type === 'multiple_choice' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                          {currentTask.options?.map((option, i) => (
                            <Button
                              key={i}
                              variant={answer === option ? "default" : "outline"}
                              className={`h-14 text-lg justify-start px-6 ${
                                answer === option ? 'bg-slate-700 hover:bg-slate-800' : ''
                              }`}
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
                            placeholder="Deine Antwort eingeben..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="h-14 text-lg text-center border-2"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                          />
                        </div>
                      )}

                      <Button
                        onClick={handleSubmit}
                        className="w-full h-14 text-lg bg-slate-700 hover:bg-slate-800"
                        disabled={!answer.trim()}
                      >
                        Antwort prüfen
                      </Button>
                    </>
                  ) : (
                    /* Result */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className={`p-6 rounded-xl mb-6 ${
                        result.is_correct 
                          ? 'bg-emerald-50 border-2 border-emerald-200' 
                          : 'bg-orange-50 border-2 border-orange-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          {result.is_correct ? (
                            <>
                              <CheckCircle className="w-8 h-8 text-emerald-500" />
                              <span className="text-xl font-bold text-emerald-700">Richtig!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-8 h-8 text-orange-500" />
                              <span className="text-xl font-bold text-orange-700">Nicht ganz richtig</span>
                            </>
                          )}
                        </div>

                        {!result.is_correct && (
                          <div className="mb-4">
                            <p className="text-slate-700">
                              Deine Antwort: <span className="font-medium text-red-600">{answer}</span>
                            </p>
                            <p className="text-slate-700">
                              Richtige Antwort: <span className="font-bold text-emerald-600">{result.correct_answer}</span>
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-2 p-4 bg-white/50 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-700">{result.explanation}</p>
                        </div>
                      </div>

                      {/* AI Explanation for wrong answers */}
                      {!result.is_correct && !explanation && (
                        <Button
                          variant="outline"
                          onClick={handleExplainMistake}
                          disabled={loadingExplanation}
                          className="w-full mb-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          {loadingExplanation ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              KI denkt nach...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Erkläre meinen Fehler (KI)
                            </>
                          )}
                        </Button>
                      )}

                      {/* AI Explanation Display */}
                      {explanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-blue-800">KI-Erklärung</span>
                          </div>
                          <p className="text-slate-700 mb-3">{explanation.explanation}</p>
                          <div className="p-3 bg-white rounded-lg mb-2">
                            <p className="text-sm text-slate-600 mb-1">Ähnliches Beispiel:</p>
                            <p className="text-slate-800">{explanation.similar_example}</p>
                          </div>
                          <p className="text-sm text-blue-700">💡 Tipp: {explanation.tip}</p>
                        </motion.div>
                      )}

                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={handleRetry}
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Nochmal versuchen
                        </Button>
                        <Button
                          onClick={handleNext}
                          disabled={currentIndex === tasks.length - 1}
                          className="flex-1 bg-slate-700 hover:bg-slate-800"
                        >
                          Nächste Aufgabe
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
