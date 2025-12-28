import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Willkommen zurück, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">∑</span>
          </div>
          <span className="font-bold text-2xl text-blue-900" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
        </Link>

        <Card className="shadow-xl border-blue-100">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-blue-900" style={{ fontFamily: 'Nunito' }}>Anmelden</CardTitle>
            <CardDescription className="text-center text-blue-600">Melde dich mit deinem Konto an</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-900">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-900">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? 'Wird angemeldet...' : 'Anmelden'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/password-reset" className="text-blue-600 hover:text-blue-700 text-sm font-medium" data-testid="forgot-password-link">
                Passwort vergessen?
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-blue-600">Noch kein Konto? </span>
              <Link to="/register" className="text-blue-700 hover:text-blue-800 font-semibold" data-testid="register-link">
                Jetzt registrieren
              </Link>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 text-center mb-2">Demo-Zugangsdaten:</p>
              <p className="text-xs text-blue-700 text-center">Admin: admin@mathevilla.de / admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
