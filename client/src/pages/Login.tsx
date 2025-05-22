import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

// Import logo direct
import madrassaLogoPng from '../assets/mymadrassa_logo.png'
import loginBgSvg from '../assets/login-bg.svg'

const loginSchema = z.object({
  email: z.string().email({ message: 'Voer een geldig e-mailadres in' }),
  password: z.string().min(6, { message: 'Wachtwoord moet minimaal 6 tekens bevatten' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login(props: any) {
  const { onLoginSuccess } = props;
  const [_, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      // In een echte app zou je hier een API call maken
      console.log('Login data:', data);
      
      // Simuleer een korte vertraging
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Toon een succesbericht
      toast({
        title: 'Ingelogd!',
        description: 'Je bent succesvol ingelogd.',
      });
      
      // Callback voor succesvolle login
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // Maak een dummy token aan en sla het op
        localStorage.setItem("auth_token", "dummy_token");
        // Navigeer naar dashboard
        setLocation('/');
      }
    } catch (error) {
      toast({
        title: 'Fout bij inloggen',
        description: 'Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Stijlvolle achtergrond */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
            <div className="absolute inset-0" style={{ 
              background: `url("https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3JtMzQ3LXBvcnBsYS0wMi1hLmpwZw.jpg")`,
              backgroundSize: 'cover',
              backgroundRepeat: 'repeat',
              opacity: 0.15,
              filter: 'grayscale(0.2) invert(0) sepia(0.2) hue-rotate(175deg) saturate(0.8)'
            }}></div>
            <div className="absolute inset-0" style={{ backgroundColor: '#3b5998', mixBlendMode: 'overlay', opacity: 0.1 }}></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 dark:to-slate-900/40"></div>
      </div>
      
      {/* Decoratieve elementen */}
      <div className="absolute top-0 right-0 w-1/3 h-64 bg-blue-500/5 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-48 bg-blue-500/5 rounded-tr-full"></div>
      
      {/* Eén container voor zowel logo als login formulier met subtiele schaduw */}
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm rounded-xl overflow-hidden relative z-10 border border-white/50 dark:border-slate-700/50">
        {/* Logo bovenaan in de container */}
        <div className="flex flex-col items-center p-8 bg-white/80 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-700/70">
          <div className="mb-6 mt-2">
            <img src={madrassaLogoPng} alt="mymadrassa" className="h-20" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-center">
            Log in om toegang te krijgen tot het platform
          </p>
          <div className="mt-2">
            <p className="text-blue-600 text-sm font-bold bg-blue-100 px-2 py-1 rounded-md">TST-ENVIRONMENT versie 1.1.0</p>
          </div>
        </div>
        
        {/* Login formulier in dezelfde container */}
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-200">
                      E-mailadres
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-primary/60" />
                        <Input
                          placeholder="naam@voorbeeld.nl"
                          className="pl-10 h-11 bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 rounded-lg focus-visible:ring-primary"
                          {...field}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel className="text-slate-700 dark:text-slate-200">
                        Wachtwoord
                      </FormLabel>
                      <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Wachtwoord vergeten?
                      </a>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-primary/60" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          className="pl-10 h-11 bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 rounded-lg focus-visible:ring-primary"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-11 mt-2 font-medium bg-primary hover:bg-primary/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inloggen...
                  </div>
                ) : "Inloggen"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-700/70 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} mymadrassa. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}