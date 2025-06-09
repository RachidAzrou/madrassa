import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, LogIn, GraduationCap, Users, UserCheck, Shield, BookOpen, School, Building2, CreditCard } from 'lucide-react';
import logoPath from '@assets/myMadrassa.png';
import backgroundImageUrl from '@assets/top-view-items-blue-background.jpg';
import logoTextPath from '@assets/Naamloos.png';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Inloggen gelukt",
        description: "Welkom terug bij myMadrassa!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Inloggen mislukt",
        description: error.message || "Controleer uw inloggegevens en probeer opnieuw.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setResetSent(true);
      toast({
        title: "Reset link verzonden",
        description: "Controleer uw e-mail voor de wachtwoord reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij verzenden",
        description: "Er is een fout opgetreden. Probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      {/* Beautiful background pattern with myMadrassa blue theme */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#4A6FA5]/25 to-[#2563eb]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-[#5A7BC4]/20 to-[#4A6FA5]/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-[#6B8DD6]/15 to-[#4A6FA5]/20 rounded-full blur-2xl"></div>
      </div>

      {/* Centered login form */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <img 
              src={logoPath} 
              alt="myMadrassa Logo" 
              className="w-20 h-20 mx-auto mb-4"
            />
            <h1 className="text-3xl font-light text-slate-900 mb-2">myMadrassa</h1>
            <p className="text-slate-500 text-sm">Welkom terug</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mailadres"
                required
                className="h-12 border-0 bg-slate-50/80 focus:bg-white rounded-xl text-base placeholder:text-slate-400 transition-all duration-200 focus:ring-2 focus:ring-[#4A6FA5]/30"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wachtwoord"
                required
                className="h-12 border-0 bg-slate-50/80 focus:bg-white rounded-xl text-base placeholder:text-slate-400 pr-12 transition-all duration-200 focus:ring-2 focus:ring-[#4A6FA5]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#4A6FA5] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#4A6FA5] to-[#5A7BC4] hover:from-[#3D5B8F] hover:to-[#4A6FA5] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inloggen...</span>
                </div>
              ) : (
                <span>Inloggen</span>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-slate-500 hover:text-[#4A6FA5] transition-colors"
              >
                Wachtwoord vergeten?
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Wachtwoord Vergeten Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Wachtwoord Reset</DialogTitle>
            <DialogDescription>
              Wachtwoord reset formulier voor myMadrassa
            </DialogDescription>
          </DialogHeader>
          {!resetSent ? (
            <div className="px-6 py-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#1e40afe6' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.628 12 9.315 12 9a6 6 0 016-6z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Wachtwoord Vergeten?</h2>
                <p className="text-slate-600 leading-relaxed">
                  Geen probleem! Voer uw e-mailadres in en we sturen u een veilige link om uw wachtwoord te resetten.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="resetEmail" className="text-slate-700 font-semibold text-sm">
                    E-mailadres
                  </Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="uw.email@mymadrassa.be"
                    required
                    className="h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setResetSent(false);
                    }}
                    className="flex-1 h-12 border-slate-300 hover:bg-slate-50 rounded-lg font-medium"
                  >
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetLoading}
                    className="flex-1 h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{ backgroundColor: '#1e40afe6' }}
                  >
                    {isResetLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verzenden...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Reset Link Verzenden</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Door een reset link aan te vragen, bevestigt u dat u de eigenaar bent van dit e-mailadres. 
                  De link is 24 uur geldig voor uw veiligheid.
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">E-mail Succesvol Verzonden!</h3>
                <div className="space-y-3 mb-6">
                  <p className="text-slate-700 text-lg">
                    We hebben een wachtwoord reset link verzonden naar:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-semibold text-blue-800 text-lg">{resetEmail}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-slate-800 mb-3">Volgende Stappen:</h4>
                <div className="space-y-2 text-sm text-slate-600 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <p>Controleer uw e-mail inbox (en spam folder)</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <p>Klik op de reset link in de e-mail</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">3</span>
                    </div>
                    <p>Stel uw nieuwe wachtwoord in</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetSent(false);
                }}
                className="w-full h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: '#1e40afe6' }}
              >
                Terug naar Inloggen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}