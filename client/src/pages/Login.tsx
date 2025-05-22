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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-primary/20 p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Decoratieve elementen */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center p-4 mb-6 dark:bg-slate-800">
            <img src={madrassaLogo} alt="Madrassa Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-center text-primary dark:text-primary-foreground mb-2">
            Madrassa Beheerplatform
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mb-3"></div>
          <p className="text-muted-foreground text-center max-w-xs">
            Log in om toegang te krijgen tot het administratie platform
          </p>
        </div>
        
        <Card className="border-none shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary"></div>
          
          <CardContent className="pt-8 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">E-mailadres</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-primary/60" />
                          <Input
                            placeholder="naam@voorbeeld.nl"
                            className="pl-11 h-12 border-slate-200 dark:border-slate-700 transition-all focus:border-primary focus:ring-1 focus:ring-primary"
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
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-sm font-medium">Wachtwoord</FormLabel>
                        <a href="#" className="text-xs text-primary hover:underline">
                          Wachtwoord vergeten?
                        </a>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-primary/60" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-11 h-12 border-slate-200 dark:border-slate-700 transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-3.5"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
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
                  className="w-full h-12 mt-2 text-base font-medium bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Bezig met inloggen...
                    </div>
                  ) : (
                    "Inloggen"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} Madrassa Beheerplatform. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </div>
  );
}