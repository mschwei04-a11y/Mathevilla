import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    grade: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Die Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Das Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    if (formData.role === 'student' && !formData.grade) {
      toast.error('Bitte wähle deine Klassenstufe');
      return;
    }

    setLoading(true);
    try {
      const user = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.grade ? parseInt(formData.grade) : null
      );
      toast.success(`Willkommen bei MatheVilla, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">∑</span>
          </div>
          <span className="font-bold text-2xl text-blue-900" style={{ fontFamily: 'Nunito' }}>MatheVilla</span>
        </Link>

        <Card className="shadow-xl border-blue-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-blue-900" style={{ fontFamily: 'Nunito' }}>Registrieren</CardTitle>
            <CardDescription className="text-center text-blue-600">Erstelle dein kostenloses Konto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-900">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="name"
                    placeholder="Dein Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-900">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.de"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-blue-900">Ich bin...</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger className="h-12 border-blue-200" data-testid="register-role-select">
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Schüler/in</SelectItem>
                    <SelectItem value="admin">Lehrer/in (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-blue-900">Klassenstufe</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
                    <Select value={formData.grade} onValueChange={(value) => handleChange('grade', value)}>
                      <SelectTrigger className="h-12 pl-10 border-blue-200" data-testid="register-grade-select">
                        <SelectValue placeholder="Klasse wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 6, 7, 8, 9, 10].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>Klasse {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-900">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mindestens 6 Zeichen"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10 pr-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="register-password-input"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-900">Passwort bestätigen</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Passwort wiederholen"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500"
                    data-testid="register-confirm-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? 'Wird registriert...' : 'Konto erstellen'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-blue-600">Schon ein Konto? </span>
              <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold" data-testid="login-link">
                Jetzt anmelden
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
