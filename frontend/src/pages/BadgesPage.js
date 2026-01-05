import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import SoundControls from '../components/SoundControls';
import MathIcon from '../components/MathIcon';
import { ArrowLeft, Award, Lock, Star, Trophy, Sparkles } from 'lucide-react';

export default function BadgesPage() {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [availableBadges, setAvailableBadges] = useState({});
  const [userBadges, setUserBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const [available, check] = await Promise.all([
        api.getAvailableBadges(),
        api.checkBadges()
      ]);
      setAvailableBadges(available.data);
      setUserBadges(check.data.current_badges || []);
      
      if (check.data.new_badges?.length > 0) {
        setNewBadges(check.data.new_badges);
        playSound('badge');
        check.data.new_badges.forEach(badge => {
          const badgeInfo = available.data[badge];
          if (badgeInfo) {
            toast.success(`Neues Badge: ${badgeInfo.icon} ${badgeInfo.name}!`);
          }
        });
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const badgeEntries = Object.entries(availableBadges);
  const earnedCount = userBadges.length;
  const totalCount = badgeEntries.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2 text-amber-600 hover:text-amber-800">
              <ArrowLeft className="w-5 h-5" />
              <span>Zurück</span>
            </Link>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-600" />
              <h1 className="font-bold text-xl text-amber-900" style={{ fontFamily: 'Nunito' }}>
                Meine Badges
              </h1>
            </div>
            <SoundControls />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Card */}
        <Card className="mb-8 bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Deine Sammlung</h2>
                <p className="text-amber-100">
                  {earnedCount} von {totalCount} Badges verdient
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{earnedCount}</div>
                <div className="text-amber-200 text-sm">Badges</div>
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${(earnedCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* New Badges Alert */}
        {newBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-emerald-100 border-2 border-emerald-300 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800">Herzlichen Glückwunsch!</p>
                <p className="text-emerald-700">
                  Du hast {newBadges.length} neue{newBadges.length > 1 ? ' Badges' : 's Badge'} verdient!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badgeEntries.map(([badgeId, badge], index) => {
            const isEarned = userBadges.includes(badgeId);
            const isNew = newBadges.includes(badgeId);
            
            return (
              <motion.div
                key={badgeId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 ${
                  isEarned 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg' 
                    : 'bg-slate-100 border-slate-200 opacity-60'
                } ${isNew ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                  {isNew && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        NEU!
                      </span>
                    </div>
                  )}
                  <CardContent className="p-4 text-center">
                    <div className={`text-5xl mb-3 ${isEarned ? '' : 'grayscale'}`}>
                      {isEarned ? badge.icon : '🔒'}
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${
                      isEarned ? 'text-amber-900' : 'text-slate-500'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className={`text-xs ${
                      isEarned ? 'text-amber-700' : 'text-slate-400'
                    }`}>
                      {badge.requirement}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Motivation Text */}
        {earnedCount < totalCount && (
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Löse mehr Aufgaben, um weitere Badges freizuschalten! 🚀
            </p>
            <Link to="/dashboard">
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600">
                Jetzt üben
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
