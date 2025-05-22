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
          <div className="absolute inset-0 overflow-hidden">
            {/* Books */}
            <div className="absolute" style={{ top: '5%', left: '10%', transform: 'rotate(-5deg)', opacity: 0.15 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <div className="absolute" style={{ top: '30%', left: '85%', transform: 'rotate(15deg)', opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <div className="absolute" style={{ top: '80%', left: '40%', transform: 'rotate(-8deg)', opacity: 0.13 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            
            {/* Pencils */}
            <div className="absolute" style={{ top: '65%', left: '20%', transform: 'rotate(45deg)', opacity: 0.12 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><path d="M11 11l5 5"></path>
              </svg>
            </div>
            <div className="absolute" style={{ top: '18%', left: '25%', transform: 'rotate(-25deg)', opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><path d="M11 11l5 5"></path>
              </svg>
            </div>
            
            {/* Calculator */}
            <div className="absolute" style={{ top: '15%', left: '60%', transform: 'rotate(-8deg)', opacity: 0.15 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16" y1="14" y2="18"></line><line x1="16" x2="16" y1="10" y2="10"></line><line x1="12" x2="12" y1="14" y2="18"></line><line x1="12" x2="12" y1="10" y2="10"></line><line x1="8" x2="8" y1="14" y2="18"></line><line x1="8" x2="8" y1="10" y2="10"></line>
              </svg>
            </div>
            
            {/* Globe */}
            <div className="absolute" style={{ top: '70%', left: '75%', transform: 'rotate(12deg)', opacity: 0.12 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            
            {/* Ruler */}
            <div className="absolute" style={{ top: '40%', left: '5%', transform: 'rotate(90deg)', opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M3 5v14h18V5H3z M6 19v-3 M10 19v-6 M14 19v-3 M18 19v-6"></path>
              </svg>
            </div>
            
            {/* Paper */}
            <div className="absolute" style={{ top: '25%', left: '40%', transform: 'rotate(-3deg)', opacity: 0.12 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <div className="absolute" style={{ top: '55%', left: '65%', transform: 'rotate(5deg)', opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            
            {/* Backpack */}
            <div className="absolute" style={{ top: '45%', left: '75%', transform: 'rotate(-5deg)', opacity: 0.13 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M5 18V9a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v9M6 21h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z"></path>
                <path d="M10 9V5"></path><path d="M14 9V5"></path><path d="M9 21v-6"></path><path d="M15 21v-6"></path>
              </svg>
            </div>
            
            {/* Chalkboard */}
            <div className="absolute" style={{ top: '5%', left: '30%', transform: 'rotate(2deg)', opacity: 0.11 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="14" rx="2"></rect>
                <line x1="3" y1="17" x2="21" y2="17"></line>
                <path d="M12 17v4"></path>
                <path d="M8 21h8"></path>
                <line x1="7" y1="8" x2="17" y2="8"></line>
                <line x1="7" y1="12" x2="17" y2="12"></line>
              </svg>
            </div>
            
            {/* Apple */}
            <div className="absolute" style={{ top: '85%', left: '10%', transform: 'rotate(-10deg)', opacity: 0.14 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.5 0 7.7 0 7.7S9.1 13.3 8 11c-.7-1.5-.7-3 0-4.5C9 4.7 10.5 2 12 2Z"/>
                <path d="M12 6.5c.5-1 1.5-2 3-2"/>
                <path d="M8.5 10.5c-.5.769-1 2.25 0 4 .81 1.42 2 2 3.5 2a4.29 4.29 0 0 0 3-1.5"/>
              </svg>
            </div>
            
            {/* Diploma */}
            <div className="absolute" style={{ top: '35%', left: '25%', transform: 'rotate(15deg)', opacity: 0.12 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <path d="M8 21h8"></path>
                <path d="M12 21V7"></path>
                <path d="M4 7h16"></path>
                <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"></path>
                <path d="M8 11h8"></path>
                <path d="M8 15h8"></path>
              </svg>
            </div>
            
            {/* Abacus */}
            <div className="absolute" style={{ top: '75%', left: '55%', transform: 'rotate(-12deg)', opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="#3b5998" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                <line x1="3" y1="8" x2="21" y2="8"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="16" x2="21" y2="16"></line>
                <line x1="9" y1="4" x2="9" y2="20"></line>
                <line x1="15" y1="4" x2="15" y2="20"></line>
              </svg>
            </div>
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