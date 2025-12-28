import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Trophy, Target, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Landing() {
  const features = [
    { icon: GraduationCap, title: 'Alle Klassenstufen', desc: 'Mathe für Klasse 5 bis 10' },
    { icon: Trophy, title: 'XP & Badges', desc: 'Verdiene Punkte und steige im Level auf' },
    { icon: Target, title: 'Personalisiert', desc: 'Empfehlungen basierend auf deinem Fortschritt' },
    { icon: Sparkles, title: 'Tägliche Challenges', desc: 'Bonus-XP für tägliches Üben' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="font-bold text-xl text-slate-900" style={{ fontFamily: 'Manrope' }}>MatheVilla</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold" data-testid="login-nav-btn">
                Anmelden
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-emerald-500 hover:bg-emerald-600 font-semibold" data-testid="register-nav-btn">
                Kostenlos starten
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Manrope' }}>
                Mathe lernen.
                <br />
                <span className="text-emerald-500">Mit Spaß.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-lg">
                Die interaktive Lernplattform für Mathematik. Übe Aufgaben, sammle XP und werde zum Mathe-Profi!
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg font-bold rounded-full" data-testid="hero-start-btn">
                    Jetzt starten <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold rounded-full border-2" data-testid="hero-login-btn">
                    Ich habe ein Konto
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Kostenlos</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Ohne Werbung</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sofort loslegen</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1719498828499-48b0086e5c21?w=800&h=600&fit=crop" 
                  alt="Schüler beim Lernen"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Level 5 erreicht!</p>
                        <p className="text-sm text-slate-500">+50 XP verdient</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12" style={{ fontFamily: 'Manrope' }}>
            Warum MatheVilla?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Grades Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>
            Für jede Klassenstufe
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Von der 5. bis zur 10. Klasse – alle wichtigen Themen des Lehrplans
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[5, 6, 7, 8, 9, 10].map((grade) => (
              <motion.div
                key={grade}
                whileHover={{ scale: 1.05 }}
                className="grade-selector-card rounded-2xl text-center"
              >
                <p className="text-5xl font-extrabold text-white mb-2" style={{ fontFamily: 'Manrope' }}>{grade}</p>
                <p className="text-slate-300 text-sm">Klasse</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope' }}>
            Bereit für bessere Noten?
          </h2>
          <p className="text-slate-300 mb-8">
            Starte jetzt und erlebe, wie viel Spaß Mathe machen kann.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-6 text-lg font-bold rounded-full" data-testid="cta-register-btn">
              Kostenlos registrieren
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-950 text-slate-400 text-center text-sm">
        <p>© 2025 MatheVilla. Lernen mit Freude.</p>
      </footer>
    </div>
  );
}
