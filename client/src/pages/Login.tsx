import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, GraduationCap, Users, CreditCard, Shield, BookOpen } from 'lucide-react';
import logoPath from '@assets/myMadrassa.png';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Ingelogd",
        description: "Je bent succesvol ingelogd.",
      });
    } catch (error: any) {
      toast({
        title: "Inloggen mislukt",
        description: error.message || "Er is een fout opgetreden bij het inloggen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex relative overflow-hidden">
      {/* Background Pattern - Educational Theme */}
      <div className="absolute inset-0 opacity-10">
        {/* Geometric shapes representing knowledge and learning */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-gradient-to-br from-green-300 to-emerald-300 rounded-lg rotate-45 blur-lg"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-br from-purple-300 to-violet-300 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-br from-orange-300 to-red-300 rounded-lg rotate-12 blur-lg"></div>
        
        {/* Subtle educational icons pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="educational-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <g opacity="0.05" fill="currentColor">
                <path d="M100 50 L120 70 L100 90 L80 70 Z" className="text-blue-600"/>
                <circle cx="150" cy="100" r="8" className="text-green-600"/>
                <rect x="45" y="145" width="10" height="10" className="text-purple-600"/>
                <path d="M170 160 L180 150 L190 160 L180 170 Z" className="text-orange-600"/>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#educational-pattern)"/>
        </svg>
      </div>

      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10 bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-600/90">
        {/* Islamic geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <g fill="white" opacity="0.3">
                  <path d="M50 0 L75 25 L50 50 L25 25 Z"/>
                  <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="1"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)"/>
          </svg>
        </div>
        
        <div className="text-center text-white relative z-10">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <img 
                src={logoPath} 
                alt="myMadrassa Logo" 
                className="h-32 w-32 mx-auto drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            myMadrassa
          </h1>
          <p className="text-xl text-blue-100 max-w-lg mb-12 leading-relaxed">
            Een modern beheersysteem voor islamitische onderwijsinstellingen in Nederland
          </p>
          
          {/* Educational Features */}
          <div className="grid grid-cols-2 gap-6 text-blue-100 max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-200" />
              </div>
              <span className="text-sm font-medium">Studentenbeheer</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-200" />
              </div>
              <span className="text-sm font-medium">Betalingsbeheer</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-200" />
              </div>
              <span className="text-sm font-medium">Lessenbeheer</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-lg">
                <GraduationCap className="h-6 w-6 text-orange-200" />
              </div>
              <span className="text-sm font-medium">Diploma Tracking</span>
            </div>
          </div>

          {/* Educational Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-blue-200">Studenten</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-sm text-blue-200">Docenten</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">15+</div>
              <div className="text-sm text-blue-200">Programma's</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/95 backdrop-blur-sm">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <img 
              src={logoPath} 
              alt="myMadrassa Logo" 
              className="h-20 w-20 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">myMadrassa</h2>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 hidden lg:block">Welkom terug</h2>
            <p className="mt-2 text-gray-600">Log in op je account</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-8 pb-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email adres
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw.email@example.com"
                    required
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Wachtwoord
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Voer je wachtwoord in"
                      required
                      className="h-12 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-4 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Inloggen...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Inloggen
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <div className="text-sm font-medium text-gray-600 mb-4">
                  Test accounts beschikbaar:
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                    <div className="font-semibold text-red-800">🔴 Administrator</div>
                    <div className="font-mono text-red-700 text-xs">admin@mymadrassa.nl / admin123</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                    <div className="font-semibold text-orange-800">🟠 Secretariaat</div>
                    <div className="font-mono text-orange-700 text-xs">secretariaat@mymadrassa.nl / admin123</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-800">🟢 Docent</div>
                    <div className="font-mono text-green-700 text-xs">docent@mymadrassa.nl / admin123</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                    <div className="font-semibold text-purple-800">🟣 Voogd</div>
                    <div className="font-mono text-purple-700 text-xs">voogd@mymadrassa.nl / admin123</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="font-semibold text-blue-800">🔵 Student</div>
                    <div className="font-mono text-blue-700 text-xs">student@mymadrassa.nl / admin123</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}