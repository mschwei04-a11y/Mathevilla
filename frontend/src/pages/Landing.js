import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Trophy, Target, Sparkles, ArrowRight, CheckCircle, Calculator, Divide, Plus, Percent } from 'lucide-react';
import { Button } from '../components/ui/button';

// Math Logo Component
const MathLogo = ({ size = 'default' }) => {
  const sizeClasses = {
    small: 'w-10 h-10 text-lg',
    default: 'w-12 h-12 text-xl',
    large: 'w-16 h-16 text-2xl'
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-xl flex items-center justify-center relative shadow-lg`}>
      <span className="text-white font-bold">∑</span>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-bold">+</span>
      </div>
    </div>
  );
};

export default function Landing() {
  const features = [
    { icon: GraduationCap, title: 'Alle Klassenstufen', desc: 'Mathe für Klasse 5 bis 10' },
    { icon: Trophy, title: 'XP & Badges', desc: 'Verdiene Punkte und steige im Level auf' },
    { icon: Target, title: 'Personalisiert', desc: 'Empfehlungen basierend auf deinem Fortschritt' },
    { icon: Sparkles, title: 'Tägliche Challenges', desc: 'Bonus-XP für tägliches Üben' }
  ];

  const mathSymbols = ['∑', '∫', 'π', '√', 'Δ', '∞'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <MathLogo />
            <span className="font-bold text-xl text-blue-900" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100" data-testid="login-nav-btn">
                Anmelden
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 font-semibold" data-testid="register-nav-btn">
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
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Calculator className="w-4 h-4" />
                Für Klasse 5-10
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight" style={{ fontFamily: 'Nunito' }}>
                Mathe lernen.
                <br />
                <span className="text-blue-600">Mit Spaß.</span>
              </h1>
              <p className="mt-6 text-lg text-blue-800/70 max-w-lg">
                Die interaktive Lernplattform für Mathematik. Übe Aufgaben, sammle XP und werde zum Mathe-Profi!
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg shadow-blue-600/30" data-testid="hero-start-btn">
                    Jetzt starten <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50" data-testid="hero-login-btn">
                    Ich habe ein Konto
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-blue-700/70">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Kostenlos</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Ohne Werbung</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Sofort loslegen</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Math symbols decoration */}
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-blue-600/10 p-8 border border-blue-100">
                {/* Floating math symbols */}
                {mathSymbols.map((symbol, i) => (
                  <motion.div
                    key={symbol}
                    className="absolute text-blue-300 text-2xl font-bold"
                    style={{
                      top: `${15 + (i * 15) % 70}%`,
                      left: `${5 + (i * 20) % 90}%`,
                    }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                  >
                    {symbol}
                  </motion.div>
                ))}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">∑</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-lg">Aufgabe des Tages</h3>
                      <p className="text-blue-600 text-sm">+15 XP</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <p className="text-blue-900 font-medium text-lg">Was ergibt 3x + 5 = 20?</p>
                    <p className="text-blue-600 text-sm mt-2">Löse nach x auf</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {['x = 5', 'x = 7', 'x = 15', 'x = 3'].map((opt, i) => (
                      <button
                        key={opt}
                        className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${
                          i === 0 
                            ? 'border-green-400 bg-green-50 text-green-700' 
                            : 'border-blue-100 hover:border-blue-300 text-blue-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-blue-900">Level 5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-blue-100 rounded-full">
                        <div className="w-3/4 h-full bg-blue-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-blue-600">75%</span>
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
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-4" style={{ fontFamily: 'Nunito' }}>
            Warum MatheVilla?
          </h2>
          <p className="text-center text-blue-700/70 mb-12 max-w-2xl mx-auto">
            Die perfekte Plattform für erfolgreiches Mathe-Lernen
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-blue-900 mb-2">{feature.title}</h3>
                <p className="text-blue-700/70">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Grades Preview */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-4" style={{ fontFamily: 'Nunito' }}>
            Für jede Klassenstufe
          </h2>
          <p className="text-center text-blue-700/70 mb-12 max-w-2xl mx-auto">
            Von der 5. bis zur 10. Klasse – alle wichtigen Themen des Lehrplans
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[5, 6, 7, 8, 9, 10].map((grade) => (
              <motion.div
                key={grade}
                whileHover={{ scale: 1.05 }}
                className="grade-selector-card rounded-2xl text-center bg-white"
              >
                <p className="text-5xl font-extrabold text-blue-600 mb-2" style={{ fontFamily: 'Nunito' }}>{grade}</p>
                <p className="text-blue-400 text-sm font-medium">Klasse</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Preview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12" style={{ fontFamily: 'Nunito' }}>
            Themen, die du lernst
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['Grundrechenarten', 'Brüche', 'Dezimalzahlen', 'Prozentrechnung', 'Geometrie', 'Gleichungen', 'Funktionen', 'Statistik', 'Trigonometrie', 'Vektorrechnung'].map((topic) => (
              <span
                key={topic}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-white text-4xl font-bold">∑</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Nunito' }}>
            Bereit für bessere Noten?
          </h2>
          <p className="text-blue-100 mb-8">
            Starte jetzt und erlebe, wie viel Spaß Mathe machen kann.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-6 text-lg font-bold rounded-xl" data-testid="cta-register-btn">
              Kostenlos registrieren
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-blue-900 text-blue-300 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">∑</span>
          </div>
          <span className="font-bold text-white">MatheVilla</span>
        </div>
        <p>© 2025 MatheVilla. Lernen mit Freude.</p>
      </footer>
    </div>
  );
}
