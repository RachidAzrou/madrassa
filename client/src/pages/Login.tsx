import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={myMadrassaLogo} alt="mymadrassa logo" className="h-32 mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Islamitisch Onderwijs Beheersysteem</p>
        </div>

        <Card className="w-full border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Inloggen</CardTitle>
            <CardDescription className="text-center">
              Voer uw gegevens in om toegang te krijgen
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@mymadrassa.be"
                  required
                  value={loginData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Verbergen" : "Tonen"}
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={loginData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Onthoud mij
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-[#1e3a8a] hover:bg-blue-800"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inloggen...</span>
                  </div>
                ) : (
                  "Inloggen"
                )}
              </Button>
              
              <div className="mt-4 text-center">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline"
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
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} mymadrassa | Alle rechten voorbehouden</p>
          <p className="mt-2">
            <a href="#" className="text-blue-600 hover:underline">Voorwaarden</a> · 
            <a href="#" className="text-blue-600 hover:underline ml-2">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
}