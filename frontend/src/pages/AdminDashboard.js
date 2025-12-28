import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Users, BookOpen, Target, TrendingDown, LogOut, 
  ClipboardList, UserCircle, Database, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const response = await api.seedDatabase();
      toast.success(response.data.message);
      loadStats();
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Fehler beim Seed der Datenbank');
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const difficultTopicsData = stats?.difficult_topics?.map(t => ({
    name: t.topic?.length > 15 ? t.topic.substring(0, 15) + '...' : t.topic,
    fehlerquote: t.error_rate
  })) || [];

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-blue-800 text-white p-6 hidden lg:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-blue-800">∑</span>
          </div>
          <span className="font-bold text-xl" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
        </div>

        <nav className="space-y-2">
          <Link to="/admin" className="sidebar-link active" data-testid="nav-dashboard">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/tasks" className="sidebar-link" data-testid="nav-tasks">
            <ClipboardList className="w-5 h-5" />
            Aufgaben verwalten
          </Link>
          <Link to="/admin/students" className="sidebar-link" data-testid="nav-students">
            <UserCircle className="w-5 h-5" />
            Schülerübersicht
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-blue-700 rounded-lg mb-4">
            <p className="text-sm text-blue-200">Angemeldet als</p>
            <p className="font-semibold truncate">{user?.name}</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full text-blue-200 hover:text-white hover:bg-blue-700"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-blue-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="font-bold text-blue-800">∑</span>
            </div>
            <span className="font-bold" style={{ fontFamily: 'Nunito' }}>Admin</span>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/tasks">
              <Button size="sm" variant="ghost" className="text-white hover:bg-blue-700">
                <ClipboardList className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/admin/students">
              <Button size="sm" variant="ghost" className="text-white hover:bg-blue-700">
                <Users className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-white hover:bg-blue-700">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900" style={{ fontFamily: 'Nunito' }} data-testid="admin-heading">
                Admin Dashboard
              </h1>
              <p className="text-blue-600">Willkommen, {user?.name}</p>
            </div>
            <Button 
              onClick={handleSeedDatabase} 
              disabled={seeding}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="seed-btn"
            >
              <Database className="w-4 h-4 mr-2" />
              {seeding ? 'Wird geladen...' : 'Seed-Daten laden'}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-blue-100 shadow-md" data-testid="students-stat">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-900">{stats?.total_students || 0}</p>
                    <p className="text-blue-500 text-sm">Schüler</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-100 shadow-md" data-testid="tasks-stat">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-900">{stats?.total_tasks || 0}</p>
                    <p className="text-blue-500 text-sm">Aufgaben</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-100 shadow-md" data-testid="answers-stat">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-900">{stats?.total_answers || 0}</p>
                    <p className="text-blue-500 text-sm">Antworten</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-100 shadow-md" data-testid="success-stat">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-900">{stats?.success_rate || 0}%</p>
                    <p className="text-blue-500 text-sm">Erfolgsquote</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Difficult Topics Chart */}
          <Card className="bg-white border-blue-100 shadow-md mb-8" data-testid="difficult-topics-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900" style={{ fontFamily: 'Nunito' }}>
                <TrendingDown className="w-5 h-5 text-red-500" />
                Schwierige Themen (höchste Fehlerquote)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {difficultTopicsData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultTopicsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DBEAFE" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#3B82F6' }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: '#3B82F6' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Fehlerquote']} />
                      <Bar dataKey="fehlerquote" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-blue-500 text-center py-12">Noch keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/tasks" data-testid="link-tasks">
              <Card className="bg-white border-blue-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Aufgaben verwalten</h3>
                    <p className="text-blue-500 text-sm">Erstellen, bearbeiten, löschen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/students" data-testid="link-students">
              <Card className="bg-white border-blue-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Schülerübersicht</h3>
                    <p className="text-blue-500 text-sm">Fortschritt und Analysen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
