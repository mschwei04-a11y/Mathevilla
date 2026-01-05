import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { 
  ArrowLeft, FileText, TrendingUp, Award, 
  BookOpen, Target, Calendar, Download, Printer
} from 'lucide-react';

export default function ParentReport() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use current user's ID if no studentId provided (for students viewing their own report)
  const targetStudentId = studentId || user?.id;

  useEffect(() => {
    if (targetStudentId) {
      loadReport();
    }
  }, [targetStudentId]);

  const loadReport = async () => {
    try {
      const response = await api.getParentReport(targetStudentId);
      setReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Bericht nicht verfügbar</p>
          <Link to={user?.role === 'admin' ? '/admin/students' : '/dashboard'}>
            <Button>Zurück</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header - Hidden on print */}
      <nav className="bg-white border-b print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link 
              to={user?.role === 'admin' ? '/admin/students' : '/dashboard'} 
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Zurück</span>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900">Elternbericht</span>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Drucken
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 print:py-4">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 mb-8 text-white print:bg-emerald-600 print:text-black print:rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Fortschrittsbericht</h1>
              <p className="text-emerald-100 print:text-emerald-800">
                Mathnashed Lernplattform
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-100 print:text-emerald-800">
                {report.period}
              </p>
              <p className="text-sm text-emerald-100 print:text-emerald-800">
                Erstellt: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Schülerinformationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-semibold text-slate-900">{report.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Klassenstufe</p>
                <p className="font-semibold text-slate-900">Klasse {report.grade}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Zusammenfassung ({report.period})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{report.summary.total_exercises}</p>
                <p className="text-sm text-slate-600">Aufgaben gelöst</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{report.summary.success_rate}%</p>
                <p className="text-sm text-slate-600">Erfolgsquote</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">{report.summary.xp_earned}</p>
                <p className="text-sm text-slate-600">XP verdient</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">Level {report.summary.current_level}</p>
                <p className="text-sm text-slate-600">Aktuelles Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-emerald-600" />
              Leistung nach Themen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.topic_breakdown?.length > 0 ? (
              <div className="space-y-4">
                {report.topic_breakdown.map((topic, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{topic.topic}</span>
                      <span className={`text-sm font-semibold ${
                        topic.rate >= 80 ? 'text-emerald-600' :
                        topic.rate >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {topic.rate}%
                      </span>
                    </div>
                    <Progress 
                      value={topic.rate} 
                      className="h-2 mb-2"
                    />
                    <p className="text-xs text-slate-500">
                      {topic.correct} von {topic.exercises} Aufgaben richtig
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">
                Noch keine Daten zu einzelnen Themen verfügbar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        {report.badges?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-emerald-600" />
                Verdiente Auszeichnungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {report.badges.map((badge, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200"
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className="font-medium text-amber-800">{badge.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💡 Empfehlung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {report.recommendation}
            </p>
          </CardContent>
        </Card>

        {/* Footer - Print Only */}
        <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-slate-500">
          <p>Dieser Bericht wurde automatisch von Mathnashed generiert.</p>
          <p>© 2025 Mathnashed - Mathe lernen mit Spaß</p>
        </div>
      </main>
    </div>
  );
}
