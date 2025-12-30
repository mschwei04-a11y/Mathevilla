import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import SoundControls from '../components/SoundControls';
import MathIcon from '../components/MathIcon';
import { 
  Trophy, Star, Zap, Target, BookOpen, TrendingUp, 
  LogOut, Calendar, Sparkles, ChevronRight, Award, Flame
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, progressRes, recsRes] = await Promise.all([
        api.getUserStats(),
        api.getProgressOverview(),
        api.getRecommendations()
      ]);
      setStats(statsRes.data);
      setProgress(progressRes.data);
      setRecommendations(recsRes.data);

      try {
        const aiRes = await api.getAIRecommendation();
        setAiRecommendation(aiRes.data.recommendation);
      } catch (e) {
        console.log('AI recommendation not available');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const xpProgress = user ? ((user.xp % 100) / 100) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <MathIcon className="w-9 h-9" />
              <span className="font-bold text-lg text-emerald-900 hidden sm:block" style={{ fontFamily: 'Nunito' }}>Mathnashed</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <SoundControls />
              <Link to="/daily-challenge" className="nav-link flex items-center gap-2" data-testid="daily-challenge-nav">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="hidden sm:inline">Challenge</span>
              </Link>
              <Link to="/progress" className="nav-link flex items-center gap-2" data-testid="progress-nav">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="hidden sm:inline">Fortschritt</span>
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="text-emerald-600 hover:bg-emerald-100" data-testid="logout-btn">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900" style={{ fontFamily: 'Nunito' }} data-testid="welcome-heading">
            Hallo, {user?.name}!
          </h1>
          <p className="text-blue-600 mt-1">Klasse {user?.grade} • Bereit zum Lernen?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-blue-600 text-white border-0 shadow-lg shadow-blue-600/20" data-testid="xp-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user?.xp || 0}</p>
                    <p className="text-blue-100 text-sm">XP gesamt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white border-blue-100 shadow-md" data-testid="level-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">Level {user?.level || 1}</p>
                    <p className="text-blue-500 text-sm">Dein Level</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white border-blue-100 shadow-md" data-testid="tasks-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats?.total_tasks_completed || 0}</p>
                    <p className="text-blue-500 text-sm">Aufgaben gelöst</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white border-blue-100 shadow-md" data-testid="success-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats?.success_rate || 0}%</p>
                    <p className="text-blue-500 text-sm">Erfolgsquote</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Level Progress */}
        <Card className="mb-8 bg-white border-blue-100 shadow-md" data-testid="level-progress-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-blue-900">Fortschritt zu Level {(user?.level || 1) + 1}</span>
              <span className="text-sm text-blue-500">{user?.xp % 100}/100 XP</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Topics/Start Learning */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-blue-100 shadow-md" data-testid="topics-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900" style={{ fontFamily: 'Nunito' }}>
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Themen für Klasse {user?.grade}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {progress.slice(0, 6).map((topic, index) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link 
                        to={`/exercise/${user?.grade}/${encodeURIComponent(topic.topic)}`}
                        className="block p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all hover:translate-x-1 border border-blue-100"
                        data-testid={`topic-${topic.topic}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-blue-900">{topic.topic}</h3>
                          <ChevronRight className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={topic.percentage} className="h-2 flex-1" />
                          <span className="text-xs text-blue-600 w-10">{Math.round(topic.percentage)}%</span>
                        </div>
                        <p className="text-xs text-blue-500 mt-2">
                          {topic.completed_tasks}/{topic.total_tasks} Aufgaben
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <Link to={`/topics/${user?.grade}`}>
                  <Button variant="outline" className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50" data-testid="all-topics-btn">
                    Alle Themen anzeigen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Daily Challenge */}
            <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0 shadow-lg" data-testid="daily-challenge-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold text-lg">Tägliche Challenge</h3>
                    <p className="text-orange-100 text-sm">+50 Bonus-XP</p>
                  </div>
                </div>
                <Link to="/daily-challenge">
                  <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold" data-testid="start-challenge-btn">
                    Challenge starten
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            {aiRecommendation && (
              <Card className="bg-white border-blue-100 shadow-md" data-testid="ai-recommendation-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">KI-Empfehlung</h3>
                  </div>
                  <p className="text-blue-700 text-sm">{aiRecommendation}</p>
                </CardContent>
              </Card>
            )}

            {/* Badges */}
            <Card className="bg-white border-blue-100 shadow-md" data-testid="badges-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-900" style={{ fontFamily: 'Nunito' }}>
                  <Award className="w-5 h-5 text-yellow-500" />
                  Deine Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.badges && user.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge) => (
                      <span key={badge} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-500 text-sm">Löse mehr Aufgaben, um Badges zu verdienen!</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card className="bg-white border-blue-100 shadow-md" data-testid="recommendations-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-900" style={{ fontFamily: 'Nunito' }}>
                    Empfohlene Themen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.slice(0, 2).map((rec) => (
                      <Link
                        key={rec.topic}
                        to={`/exercise/${user?.grade}/${encodeURIComponent(rec.topic)}`}
                        className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        <p className="font-medium text-blue-900 text-sm">{rec.topic}</p>
                        <p className="text-xs text-blue-500 mt-1">{rec.reason}</p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
