import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, BookOpen, ChevronRight, Brain, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function TopicSelection() {
  const { grade } = useParams();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState({});
  const [readiness, setReadiness] = useState({});
  const [loading, setLoading] = useState(true);

  const currentGrade = grade || user?.grade || 5;

  useEffect(() => {
    loadTopics();
  }, [currentGrade]);

  const loadTopics = async () => {
    try {
      const [topicsRes, progressRes] = await Promise.all([
        api.getTopics(currentGrade),
        api.getProgressOverview()
      ]);
      setTopics(topicsRes.data.topics);
      
      const progressMap = {};
      progressRes.data.forEach(p => {
        progressMap[p.topic] = p;
      });
      setProgress(progressMap);

      // Load readiness for each topic
      const readinessMap = {};
      for (const topic of topicsRes.data.topics) {
        try {
          const res = await api.getTestReadiness(topic);
          readinessMap[topic] = res.data;
        } catch (e) {
          // Ignore errors for individual topics
        }
      }
      setReadiness(readinessMap);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReadinessIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'needs_review':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <XCircle className="w-4 h-4 text-slate-300" />;
    }
  };

  const getReadinessText = (status) => {
    switch (status) {
      case 'ready':
        return 'Testbereit';
      case 'needs_review':
        return 'Wiederholung nötig';
      default:
        return 'Noch üben';
    }
  };

  const topicImages = {
    'Grundrechenarten': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    'Brüche einführen': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
    'Dezimalzahlen': 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=300&fit=crop',
    'Geometrie Grundlagen': 'https://images.unsplash.com/photo-1754795192466-abe08a4d7c03?w=400&h=300&fit=crop',
    'Bruchrechnung': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
    'Prozentrechnung': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop',
    'Lineare Funktionen': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    'Quadratische Funktionen': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
  };

  const getTopicImage = (topic) => {
    return topicImages[topic] || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4" data-testid="back-to-dashboard">
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="topics-heading">
            Themen für Klasse {currentGrade}
          </h1>
          <p className="text-slate-600 mt-1">Wähle ein Thema zum Üben</p>
        </div>
      </div>

      {/* Topics Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => {
            const topicProgress = progress[topic] || { percentage: 0, completed_tasks: 0, total_tasks: 0 };
            
            return (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/exercise/${currentGrade}/${encodeURIComponent(topic)}`} data-testid={`topic-card-${topic}`}>
                  <Card className="topic-card overflow-hidden h-full">
                    <div className="relative h-40">
                      <img 
                        src={getTopicImage(topic)} 
                        alt={topic}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 topic-gradient"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Manrope' }}>{topic}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">
                          {topicProgress.completed_tasks}/{topicProgress.total_tasks} Aufgaben
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          {Math.round(topicProgress.percentage)}%
                        </span>
                      </div>
                      <Progress value={topicProgress.percentage} className="h-2" />
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          {topicProgress.correct_answers || 0} richtig beantwortet
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Keine Themen für diese Klassenstufe verfügbar.</p>
          </div>
        )}
      </main>
    </div>
  );
}
