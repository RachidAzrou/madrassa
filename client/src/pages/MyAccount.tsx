import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Input 
} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Lock, Bell, Shield } from "lucide-react";

// Schema voor het formulier
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "Voornaam is verplicht" }),
  lastName: z.string().min(1, { message: "Achternaam is verplicht" }),
  email: z.string().email({ message: "Ongeldig e-mailadres" }),
  phone: z.string().optional(),
  role: z.string().min(1, { message: "Rol is verplicht" }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Schema voor het wachtwoord formulier
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Huidig wachtwoord is verplicht" }),
  newPassword: z.string().min(8, { message: "Wachtwoord moet ten minste 8 tekens bevatten" }),
  confirmPassword: z.string().min(1, { message: "Bevestig je wachtwoord" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Demo gebruiker
const demoUser = {
  firstName: "Ahmed",
  lastName: "Hassan",
  email: "ahmed.hassan@mymadrassa.nl",
  phone: "+31 6 12345678",
  role: "Administrator",
  avatar: "" // URL voor avatar indien beschikbaar
};

const MyAccount = () => {
  // Formulier voor profielgegevens
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      email: demoUser.email,
      phone: demoUser.phone,
      role: demoUser.role,
    },
  });

  // Formulier voor wachtwoord wijzigen
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    console.log("Profielgegevens bijgewerkt:", data);
    // Hier zou je normaal een API-call doen om de gegevens op te slaan
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    console.log("Wachtwoord bijgewerkt:", data);
    // Hier zou je normaal een API-call doen om het wachtwoord te wijzigen
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          <User className="mr-2 h-6 w-6 text-[#1e3a8a]" /> Mijn Account
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Profielkaart */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={demoUser.avatar} />
              <AvatarFallback className="bg-[#1e3a8a] text-white text-xl">
                {demoUser.firstName[0]}{demoUser.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{demoUser.firstName} {demoUser.lastName}</CardTitle>
            <CardDescription>{demoUser.role}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-500">Email:</span> {demoUser.email}
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-500">Telefoon:</span> {demoUser.phone}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Afmelden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs voor accountinstellingen */}
        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Accountinstellingen</CardTitle>
            <CardDescription>
              Beheer uw accountinstellingen en voorkeuren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profiel" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-blue-900/10">
                <TabsTrigger value="profiel" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Profiel
                </TabsTrigger>
                <TabsTrigger value="wachtwoord" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Wachtwoord
                </TabsTrigger>
                <TabsTrigger value="notificaties" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Notificaties
                </TabsTrigger>
              </TabsList>

              {/* Profieltab inhoud */}
              <TabsContent value="profiel" className="space-y-4">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voornaam</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Achternaam</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefoon</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer een rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Administrator">Administrator</SelectItem>
                              <SelectItem value="Docent">Docent</SelectItem>
                              <SelectItem value="Administratief Medewerker">Administratief Medewerker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                      Wijzigingen opslaan
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Wachtwoord tab inhoud */}
              <TabsContent value="wachtwoord" className="space-y-4">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Huidig wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nieuw wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bevestig nieuw wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                        Wachtwoord wijzigen
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Notificaties tab inhoud */}
              <TabsContent value="notificaties" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Bell className="h-5 w-5 mt-0.5 text-gray-500" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">Email notificaties</h4>
                      <p className="text-sm text-gray-500">
                        Ontvang belangrijke updates over uw account, betalingen en meer via e-mail.
                      </p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Beheren
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Shield className="h-5 w-5 mt-0.5 text-gray-500" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">Beveiliging</h4>
                      <p className="text-sm text-gray-500">
                        Beheer uw beveiligingsinstellingen en gekoppelde apparaten.
                      </p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Bekijken
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Lock className="h-5 w-5 mt-0.5 text-gray-500" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">Account privacy</h4>
                      <p className="text-sm text-gray-500">
                        Beheer uw persoonlijke informatie en zichtbaarheid.
                      </p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Aanpassen
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyAccount;