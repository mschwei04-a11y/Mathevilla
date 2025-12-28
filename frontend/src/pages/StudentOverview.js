import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { 
  ArrowLeft, Users, Trophy, Target, TrendingUp, TrendingDown,
  BarChart3, ClipboardList, UserCircle, LogOut, Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentOverview() {
  const { studentId } = useParams();
  const { logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadStudentDetail(studentId);
    } else {
      loadStudents();
    }
  }, [studentId]);

  const loadStudents = async () => {
    try {
      const response = await api.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Fehler beim Laden der Schüler');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetail = async (id) => {
    try {
      const response = await api.getStudentDetail(id);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error('Error loading student detail:', error);
      toast.error('Fehler beim Laden der Schülerdaten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Student Detail View
  if (studentId && selectedStudent) {
    const topicChartData = selectedStudent.topic_breakdown?.map(t => ({
      name: t.topic.length > 12 ? t.topic.substring(0, 12) + '...' : t.topic,
      fullName: t.topic,
      erfolgsquote: t.rate,
      aufgaben: t.total
    })) || [];

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-6 hidden lg:block">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Manrope' }}>MatheVilla</span>
          </div>

          <nav className="space-y-2">
            <Link to="/admin" className="sidebar-link">
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/admin/tasks" className="sidebar-link">
              <ClipboardList className="w-5 h-5" />
              Aufgaben verwalten
            </Link>
            <Link to="/admin/students" className="sidebar-link active">
              <UserCircle className="w-5 h-5" />
              Schülerübersicht
            </Link>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <Button 
              variant="ghost" 
              onClick={() => { logout(); window.location.href = '/'; }} 
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="lg:ml-64 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <Link to="/admin/students" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
              <ArrowLeft className="w-5 h-5" />
              Zurück zur Übersicht
            </Link>

            {/* Student Header */}
            <Card className="border-0 shadow-md mb-6" data-testid="student-detail-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-600">
                      {selectedStudent.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                      {selectedStudent.name}
                    </h1>
                    <p className="text-slate-600">{selectedStudent.email} • Klasse {selectedStudent.grade}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{selectedStudent.xp || 0}</p>
                      <p className="text-sm text-slate-500">XP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">Level {selectedStudent.level || 1}</p>
                      <p className="text-sm text-slate-500">Level</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{selectedStudent.tasks_completed || 0}</p>
                    <p className="text-slate-500 text-sm">Aufgaben gelöst</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{selectedStudent.success_rate || 0}%</p>
                    <p className="text-slate-500 text-sm">Erfolgsquote</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{selectedStudent.badges?.length || 0}</p>
                    <p className="text-slate-500 text-sm">Badges</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Topic Breakdown Chart */}
            <Card className="border-0 shadow-md mb-6" data-testid="topic-chart">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Manrope' }}>Erfolgsquote pro Thema</CardTitle>
              </CardHeader>
              <CardContent>
                {topicChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'erfolgsquote' ? `${value}%` : value, 
                            name === 'erfolgsquote' ? 'Erfolgsquote' : 'Aufgaben'
                          ]}
                          labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                        />
                        <Bar dataKey="erfolgsquote" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-12">Noch keine Daten verfügbar</p>
                )}
              </CardContent>
            </Card>

            {/* Topic Breakdown Table */}
            <Card className="border-0 shadow-md" data-testid="topic-table">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Manrope' }}>Detaillierte Themen-Analyse</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thema</TableHead>
                      <TableHead>Aufgaben</TableHead>
                      <TableHead>Richtig</TableHead>
                      <TableHead>Erfolgsquote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStudent.topic_breakdown?.map((topic) => (
                      <TableRow key={topic.topic}>
                        <TableCell className="font-medium">{topic.topic}</TableCell>
                        <TableCell>{topic.total}</TableCell>
                        <TableCell>{topic.correct}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={topic.rate} className="w-20 h-2" />
                            <span className={`font-medium ${
                              topic.rate >= 70 ? 'text-emerald-600' :
                              topic.rate >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {topic.rate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!selectedStudent.topic_breakdown || selectedStudent.topic_breakdown.length === 0) && (
                  <div className="text-center py-12 text-slate-500">
                    Noch keine Themen bearbeitet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges */}
            {selectedStudent.badges?.length > 0 && (
              <Card className="border-0 shadow-md mt-6" data-testid="badges-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
                    <Star className="w-5 h-5 text-yellow-500" />
                    Verdiente Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {selectedStudent.badges.map((badge) => (
                      <span key={badge} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                        {badge}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Students List View
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-6 hidden lg:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl" style={{ fontFamily: 'Manrope' }}>MatheVilla</span>
        </div>

        <nav className="space-y-2">
          <Link to="/admin" className="sidebar-link">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/tasks" className="sidebar-link">
            <ClipboardList className="w-5 h-5" />
            Aufgaben verwalten
          </Link>
          <Link to="/admin/students" className="sidebar-link active">
            <UserCircle className="w-5 h-5" />
            Schülerübersicht
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            variant="ghost" 
            onClick={() => { logout(); window.location.href = '/'; }} 
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Schüler</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Manrope' }} data-testid="students-heading">
            Schülerübersicht
          </h1>

          {/* Students Table */}
          <Card className="border-0 shadow-md" data-testid="students-table">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Klasse</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Aufgaben</TableHead>
                      <TableHead>Erfolgsquote</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.grade || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            {student.level || 1}
                          </span>
                        </TableCell>
                        <TableCell>{student.xp || 0}</TableCell>
                        <TableCell>{student.tasks_completed || 0}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            student.success_rate >= 70 ? 'text-emerald-600' :
                            student.success_rate >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {student.success_rate || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/students/${student.id}`}>
                            <Button size="sm" variant="outline" data-testid={`view-${student.id}`}>
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {students.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">Noch keine Schüler registriert</p>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-sm text-slate-500 mt-4">
            {students.length} Schüler registriert
          </p>
        </div>
      </main>
    </div>
  );
}
