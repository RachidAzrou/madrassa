import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

// Logo import
import madrassaLogo from '../assets/mymadrassa_logo.png';

const loginSchema = z.object({
  email: z.string().email({ message: 'Voer een geldig e-mailadres in' }),
  password: z.string().min(6, { message: 'Wachtwoord moet minimaal 6 tekens bevatten' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
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
      }
      
      // Navigeer naar dashboard
      setLocation('/');
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#0f1117]">
      {/* Linker kolom - Visuele sectie */}
      <div className="hidden md:flex flex-col justify-center items-center relative overflow-hidden">
        {/* Mooie achtergrond met patroon en gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-white dark:from-primary/10 dark:via-slate-900 dark:to-slate-950"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a8a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '25px 25px'
        }}></div>
        
        <div className="relative z-10 max-w-md p-8 text-center">
          <img src={madrassaLogo} alt="Madrassa Logo" className="h-36 mx-auto mb-10 drop-shadow-lg" />
          <h2 className="text-4xl font-bold text-primary mb-6">Welkom bij Madrassa</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
            Het beheerplatform voor al je administratieve taken
          </p>
          
          <div className="flex justify-center space-x-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="w-3 h-3 rounded-full bg-primary/70"></span>
            <span className="w-3 h-3 rounded-full bg-primary/40"></span>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white dark:bg-slate-800 shadow-lg p-4 rounded-lg text-left">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Veilig & Beveiligd</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">End-to-end versleuteling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rechter kolom - Login form */}
      <div className="flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-10">
            <img src={madrassaLogo} alt="Madrassa Logo" className="h-28 drop-shadow-lg" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Log in op je account
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Vul je gegevens in om toegang te krijgen
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      E-mailadres
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="naam@voorbeeld.nl"
                          className="h-11 bg-transparent dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 rounded-lg focus-visible:ring-primary"
                          {...field}
                          disabled={isLoading}
                        />
                        <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Wachtwoord
                      </FormLabel>
                      <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Wachtwoord vergeten?
                      </a>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          className="h-11 bg-transparent dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 rounded-lg focus-visible:ring-primary"
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
                className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
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
          
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Madrassa. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}