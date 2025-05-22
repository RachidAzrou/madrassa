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
          <div className="absolute inset-0 overflow-hidden" style={{ 
            background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\' viewBox=\'0 0 400 400\'%3E%3Cstyle%3E.icon%7Bfill:none;stroke:%233b5998;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;opacity:0.15%7D%3C/style%3E%3Crect width=\'400\' height=\'400\' fill=\'none\'/%3E%3C!-- Globe --%3E%3Ccircle class=\'icon\' cx=\'345\' cy=\'65\' r=\'25\'/%3E%3Cpath class=\'icon\' d=\'M320 65h50M345 40a38.3 38.3 0 0 1 10 25 38.3 38.3 0 0 1-10 25 38.3 38.3 0 0 1-10-25 38.3 38.3 0 0 1 10-25z\'/%3E%3C!-- Phone --%3E%3Crect class=\'icon\' x=\'245\' y=\'25\' width=\'25\' height=\'40\' rx=\'3\'/%3E%3Ccircle class=\'icon\' cx=\'257.5\' cy=\'55\' r=\'2\'/%3E%3C!-- Heart --%3E%3Cpath class=\'icon\' d=\'M760 75c3.5-3.5 5.5-7.5 5.5-12.5 0-5-1.5-9-5.5-12.5-3.5-3.5-7.5-5.5-12.5-5.5-5 0-9 2-12.5 5.5L725 60l-10-10c-3.5-3.5-7.5-5.5-12.5-5.5-5 0-9 2-12.5 5.5-3.5 3.5-5.5 7.5-5.5 12.5 0 5 2 9 5.5 12.5l35 35 35-35z\'/%3E%3C!-- Robot --%3E%3Crect class=\'icon\' x=\'380\' y=\'380\' width=\'30\' height=\'25\' rx=\'2\'/%3E%3Ccircle class=\'icon\' cx=\'390\' cy=\'390\' r=\'2\'/%3E%3Ccircle class=\'icon\' cx=\'400\' cy=\'390\' r=\'2\'/%3E%3Cpath class=\'icon\' d=\'M395 360v-5h-10a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h30a2 2 0 0 0 2-2v-16a2 2 0 0 0-2-2h-10v5\'/%3E%3Cpath class=\'icon\' d=\'M380 405v-5M410 405v-5\'/%3E%3C!-- Soccer ball --%3E%3Ccircle class=\'icon\' cx=\'580\' cy=\'80\' r=\'25\'/%3E%3Cpath class=\'icon\' d=\'M580 55l10 10h10l5-10v-10h-10l-10 5-5 5M580 105l10-10h10l5 10v10h-10l-10-5-5-5M555 80h10l10-10v-10l-10-5h-10l-5 10v10l5 5M605 80h-10l-10 10v10l10 5h10l5-10v-10l-5-5\'/%3E%3C!-- Music note --%3E%3Cpath class=\'icon\' d=\'M32 218c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10zM22 208V178M22 178l25-5v30\'/%3E%3Cpath class=\'icon\' d=\'M57 203c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z\'/%3E%3C!-- Star --%3E%3Cpath class=\'icon\' d=\'M320 265l5.9 12 13.1 1.9-9.5 9.3 2.2 13-11.7-6.2-11.7 6.2 2.2-13-9.5-9.3 13.1-1.9 5.9-12z\'/%3E%3C!-- Apple --%3E%3Cpath class=\'icon\' d=\'M275 382c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5 10 10z\'/%3E%3Cpath class=\'icon\' d=\'M280 350c0-5.5 4.5-10 10-10s10 4.5 10 10c0 0 0 10-10 15-10-5-10-15-10-15z\'/%3E%3Cpath class=\'icon\' d=\'M295 345c-2.5-5-7.5-7.5-12.5-5\'/%3E%3C!-- Light bulb --%3E%3Cpath class=\'icon\' d=\'M180 280a20 20 0 0 1 40 0c0 10-10 15-10 15h-20s-10-5-10-15z\'/%3E%3Cpath class=\'icon\' d=\'M185 305h30M190 315h20M195 325h10\'/%3E%3C!-- Rocket --%3E%3Cpath class=\'icon\' d=\'M140 180c0-30 20-50 20-50s20 20 20 50c0 20-10 25-10 25l-5 15h-10l-5-15s-10-5-10-25z\'/%3E%3Cpath class=\'icon\' d=\'M150 220c-5-5-5-15-5-15h30s0 10-5 15M150 200h30\'/%3E%3C!-- Book --%3E%3Cpath class=\'icon\' d=\'M40 310h50v60H40c-5 0-10-5-10-10v-40c0-5 5-10 10-10z\'/%3E%3Cpath class=\'icon\' d=\'M40 310c5 0 10 5 10 10v40c0 5-5 10-10 10\'/%3E%3C!-- Graduate cap --%3E%3Cpath class=\'icon\' d=\'M200 180l-50 25v35c0 15 25 25 50 25s50-10 50-25v-35l-50-25z\'/%3E%3Cpath class=\'icon\' d=\'M200 180l50 25-50 25-50-25z\'/%3E%3Cpath class=\'icon\' d=\'M240 215v25\'/%3E%3C!-- Pencil --%3E%3Cpath class=\'icon\' d=\'M330 150l10 10-40 40-10-10zM300 190l10 10\'/%3E%3C!-- Test tubes --%3E%3Cpath class=\'icon\' d=\'M505 195v-45h10v45c0 10-10 15-10 15s-10-5-10-15v-45h10\'/%3E%3Cpath class=\'icon\' d=\'M535 195v-45h10v45c0 10-10 15-10 15s-10-5-10-15v-45h10\'/%3E%3Ccircle class=\'icon\' cx=\'505\' cy=\'180\' r=\'1\'/%3E%3Ccircle class=\'icon\' cx=\'505\' cy=\'185\' r=\'1\'/%3E%3Ccircle class=\'icon\' cx=\'505\' cy=\'190\' r=\'1\'/%3E%3Ccircle class=\'icon\' cx=\'535\' cy=\'180\' r=\'1\'/%3E%3Ccircle class=\'icon\' cx=\'535\' cy=\'185\' r=\'1\'/%3E%3Ccircle class=\'icon\' cx=\'535\' cy=\'190\' r=\'1\'/%3E%3C!-- ABC Book --%3E%3Crect class=\'icon\' x=\'390\' y=\'300\' width=\'35\' height=\'40\' rx=\'2\'/%3E%3Cpath class=\'icon\' d=\'M400 320h15M400 330h15\'/%3E%3Cpath class=\'icon\' d=\'M405 315a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5z\'/%3E%3Ctext class=\'icon\' x=\'407.5\' y=\'310\' font-family=\'Arial\' font-size=\'10\' text-anchor=\'middle\'>ABC</text%3E%3C!-- Cloud --%3E%3Cpath class=\'icon\' d=\'M45 85c0-8.3 6.7-15 15-15 5 0 9.2 2.5 11.9 6.5 2.4-1.6 5.1-2.5 8.1-2.5 8.3 0 15 6.7 15 15h5c0 5.5-4.5 10-10 10H50c-5.5 0-10-4.5-10-10h5z\'/%3E%3C!-- Sun --%3E%3Ccircle class=\'icon\' cx=\'45\' cy=\'350\' r=\'15\'/%3E%3Cpath class=\'icon\' d=\'M45 325v-10M45 385v-10M20 350h-10M70 350h10M28 333l-7-7M62 367l7 7M28 367l-7 7M62 333l7-7\'/%3E%3C!-- A+ grade --%3E%3Cpath class=\'icon\' d=\'M345 350h10l5 15h-20l5-15z\'/%3E%3Cpath class=\'icon\' d=\'M340 357.5h20M365 360v-15h5\'/%3E%3Cpath class=\'icon\' d=\'M365 352.5h10\'/%3E%3C!-- Chat icon --%3E%3Cpath class=\'icon\' d=\'M115 365a 15 15 0 0 1 15-15h30a 15 15 0 0 1 15 15v10a15 15 0 0 1-15 15h-30a 15 15 0 0 1-15-15v-10z\'/%3E%3Cpath class=\'icon\' d=\'M150 385v10\'/%3E%3C/svg%3E") center/cover',
            opacity: 0.2
          }}>
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