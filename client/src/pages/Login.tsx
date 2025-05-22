import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import myMadrassaLogo from "../assets/mymadrassa_logo.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      console.log("Login data:", data);
      // Simuleer een succesvolle login voor nu - in een echte implementatie zou je apiRequest gebruiken
      // return await apiRequest("/api/login", {
      //   method: 'POST',
      //   body: data
      // });
      
      // Voor demo doeleinden - in een echte implementatie verwijder je dit en gebruik je de bovenstaande code
      if (data.email === "admin@mymadrassa.be" && data.password === "admin123") {
        return { success: true, user: { name: "Admin", role: "administrator" } };
      } else {
        throw new Error("Ongeldige inloggegevens");
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Inloggen gelukt",
        description: "U bent succesvol ingelogd",
        variant: "default",
      });
      // Navigeer naar dashboard na succesvolle login
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Inloggen mislukt",
        description: error.message || "Er is een fout opgetreden tijdens het inloggen",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-[#1e3a8a]">
          <div className="pt-10 pb-6 px-8 text-center">
            <img src={myMadrassaLogo} alt="mymadrassa logo" className="h-24 mx-auto" />
          </div>
          
          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500 text-center mb-6">
              Log in om toegang te krijgen tot uw account
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">E-mailadres</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@mymadrassa.be"
                  required
                  value={loginData.email}
                  onChange={handleInputChange}
                  className="h-11 px-4 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={loginData.password}
                    onChange={handleInputChange}
                    className="h-11 pl-4 pr-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded text-[#1e3a8a] focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Onthoud mij
                </label>
              </div>
            
              <Button
                type="submit"
                className="w-full h-11 bg-[#1e3a8a] hover:bg-blue-800 transition-colors shadow-md rounded-md text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inloggen...</span>
                  </div>
                ) : (
                  "Inloggen"
                )}
              </Button>
              
              <div className="text-center">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Wachtwoord herstel",
                      description: "Neem contact op met uw systeembeheerder om uw wachtwoord te herstellen",
                      variant: "default",
                    });
                  }}
                >
                  Wachtwoord vergeten?
                </a>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} mymadrassa | Alle rechten voorbehouden</p>
          <p className="mt-2 space-x-3">
            <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">Voorwaarden</a>
            <span>·</span>
            <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
}