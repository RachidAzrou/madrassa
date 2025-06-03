import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, LogIn, GraduationCap, Users, CreditCard, Shield, BookOpen } from 'lucide-react';
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
      await login(email, password);
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Blurred background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: '#93c5fd',
          backgroundImage: `url("${backgroundImageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(3px)',
          transform: 'scale(1.1)'
        }}
      ></div>
      {/* Educational overlay for better contrast */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.3) 100%)'
        }}
      ></div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .float-animation {
            animation: float 6s ease-in-out infinite;
          }
        `
      }} />
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 z-10">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <img 
              src={logoPath} 
              alt="myMadrassa Logo" 
              className="w-32 h-32 mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-4xl font-bold text-slate-800 mb-4 drop-shadow-sm">
              myMadrassa
            </h1>
            <p className="text-lg text-slate-700 font-medium drop-shadow-sm">
              Educatief Beheersysteem voor Islamitische Onderwijsinstellingen
            </p>
          </div>

          {/* Educational Icons */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="text-center float-animation">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <GraduationCap className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-sm text-slate-700 font-medium">Onderwijs</p>
            </div>
            <div className="text-center float-animation" style={{ animationDelay: '2s' }}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Users className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-sm text-slate-700 font-medium">Studenten</p>
            </div>
            <div className="text-center float-animation" style={{ animationDelay: '4s' }}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <CreditCard className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-sm text-slate-700 font-medium">Betalingen</p>
            </div>
          </div>

          {/* Role descriptions */}
          <div className="mt-12 space-y-3 text-left">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm text-slate-700 font-medium">Administrator - Volledige systeemtoegang</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="text-sm text-slate-700 font-medium">Docent - Onderwijs en klassenbeheer</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-700 font-medium">Voogd - Studentinformatie en voortgang</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10">
        <Card className="w-full max-w-md bg-white border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="lg:hidden mb-2">
              <img 
                src={logoPath} 
                alt="myMadrassa Logo" 
                className="w-16 h-16 mx-auto mb-1"
              />
              <img 
                src={logoTextPath} 
                alt="myMadrassa" 
                className="h-10 mx-auto"
              />
            </div>
            <CardDescription className="text-slate-600">
              Log in om toegang te krijgen tot uw dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  E-mailadres
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="uw.email@voorbeeld.be"
                  required
                  className="h-11 border-slate-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Uw wachtwoord"
                    required
                    className="h-11 border-slate-300 focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl bg-[#3a5b9a]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Inloggen...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Inloggen</span>
                  </div>
                )}
              </Button>

              {/* Wachtwoord vergeten link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm hover:text-blue-800 underline text-[#3a5b9a]"
                >
                  Wachtwoord vergeten?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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