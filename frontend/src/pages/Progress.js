import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Trophy, Star, Zap, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function ProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, progressRes] = await Promise.all([
        api.getUserStats(),
        api.getProgressOverview()
      ]);
      setStats(statsRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#0F172A', '#38BDF8', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const chartData = progress.map(p => ({
    name: p.topic.length > 12 ? p.topic.substring(0, 12) + '...' : p.topic,
    fullName: p.topic,
    fortschritt: Math.round(p.percentage),
    aufgaben: p.completed_tasks,
    richtig: p.correct_answers
  }));

  const pieData = [
    { name: 'Richtig', value: stats?.correct_answers || 0 },
    { name: 'Falsch', value: (stats?.total_tasks_completed || 0) - (stats?.correct_answers || 0) }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4" data-testid="back-to-dashboard">
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="progress-heading">
            Dein Fortschritt
          </h1>
          <p className="text-slate-600 mt-1">Klasse {user?.grade} • Übersicht deiner Leistungen</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md" data-testid="total-tasks-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.total_tasks_completed || 0}</p>
                  <p className="text-slate-500 text-sm">Aufgaben gelöst</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="correct-answers-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.correct_answers || 0}</p>
                  <p className="text-slate-500 text-sm">Richtige Antworten</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="success-rate-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.success_rate || 0}%</p>
                  <p className="text-slate-500 text-sm">Erfolgsquote</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="xp-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.xp || 0}</p>
                  <p className="text-slate-500 text-sm">XP gesamt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Topic Progress */}
          <Card className="border-0 shadow-md" data-testid="progress-chart">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Manrope' }}>Fortschritt pro Thema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Fortschritt']}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="fortschritt" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Correct vs Wrong */}
          <Card className="border-0 shadow-md" data-testid="accuracy-chart">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Manrope' }}>Richtig vs. Falsch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {stats?.total_tasks_completed > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400">Noch keine Daten verfügbar</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md" data-testid="strengths-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Deine Stärken
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.strengths?.length > 0 ? (
                <div className="space-y-4">
                  {stats.strengths.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="font-medium text-emerald-800">{s.topic}</span>
                      <span className="text-emerald-600 font-bold">{s.rate}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Löse mehr Aufgaben, um deine Stärken zu entdecken!</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="weaknesses-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
                <TrendingDown className="w-5 h-5 text-red-500" />
                Hier solltest du üben
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.weaknesses?.length > 0 ? (
                <div className="space-y-4">
                  {stats.weaknesses.map((w, idx) => (
                    <Link 
                      key={idx} 
                      to={`/exercise/${user?.grade}/${encodeURIComponent(w.topic)}`}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <span className="font-medium text-red-800">{w.topic}</span>
                      <span className="text-red-600 font-bold">{w.rate}%</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Super! Keine schwachen Themen gefunden.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card className="border-0 shadow-md" data-testid="badges-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
              <Award className="w-5 h-5 text-yellow-500" />
              Deine Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.badges?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {stats.badges.map((badge) => (
                  <div key={badge} className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-full font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {badge}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">Löse 10 Aufgaben richtig für dein erstes Badge!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Progress List */}
        <Card className="border-0 shadow-md mt-6" data-testid="topic-progress-list">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope' }}>Detaillierter Fortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress.map((topic) => (
                <div key={topic.topic} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <Link 
                      to={`/exercise/${user?.grade}/${encodeURIComponent(topic.topic)}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600"
                    >
                      {topic.topic}
                    </Link>
                    <span className="text-sm text-slate-500">
                      {topic.completed_tasks}/{topic.total_tasks} Aufgaben
                    </span>
                  </div>
                  <Progress value={topic.percentage} className="h-2" />
                  <div className="flex justify-between mt-2 text-sm text-slate-500">
                    <span>{topic.correct_answers} richtig beantwortet</span>
                    <span>{Math.round(topic.percentage)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
