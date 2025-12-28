import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/password-reset-request`, { email });
      setRequestSent(true);
      toast.success('Wenn ein Konto existiert, wurde ein Reset-Link gesendet');
      
      // In demo mode, show the token
      if (response.data.reset_token) {
        console.log('Demo Reset Token:', response.data.reset_token);
        toast.info(`Demo Token: ${response.data.reset_token.substring(0, 8)}...`, { duration: 10000 });
      }
    } catch (error) {
      toast.error('Fehler beim Senden der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/password-reset-confirm`, {
        token: token,
        new_password: newPassword
      });
      setResetComplete(true);
      toast.success('Passwort erfolgreich geändert!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  // Reset complete view
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-blue-100">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2" style={{ fontFamily: 'Nunito' }}>
                Passwort geändert!
              </h2>
              <p className="text-blue-600 mb-6">
                Dein Passwort wurde erfolgreich zurückgesetzt.
              </p>
              <Link to="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Jetzt anmelden
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Confirm password reset (with token)
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">Σ</span>
            </div>
            <span className="font-bold text-2xl text-blue-900" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
          </Link>

          <Card className="shadow-xl border-blue-100">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-blue-900" style={{ fontFamily: 'Nunito' }}>
                Neues Passwort
              </CardTitle>
              <CardDescription className="text-center text-blue-600">
                Gib dein neues Passwort ein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-blue-900">Neues Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Mindestens 6 Zeichen"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                      data-testid="new-password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-blue-900">Passwort bestätigen</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Passwort wiederholen"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                      data-testid="confirm-password-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
                  disabled={loading}
                  data-testid="reset-confirm-btn"
                >
                  {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Request sent view
  if (requestSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-blue-100">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2" style={{ fontFamily: 'Nunito' }}>
                E-Mail gesendet!
              </h2>
              <p className="text-blue-600 mb-6">
                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen gesendet.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück zum Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Request password reset view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">Σ</span>
          </div>
          <span className="font-bold text-2xl text-blue-900" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
        </Link>

        <Card className="shadow-xl border-blue-100">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-blue-900" style={{ fontFamily: 'Nunito' }}>
              Passwort vergessen?
            </CardTitle>
            <CardDescription className="text-center text-blue-600">
              Gib deine E-Mail-Adresse ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset} className="space-y-4">
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
                    data-testid="reset-email-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
                disabled={loading}
                data-testid="reset-request-btn"
              >
                {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück zum Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
