import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
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
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  User, Lock, Bell, Shield, UserCircle, KeyRound, BellRing, 
  Settings, BookOpen, FileText, School, UploadCloud, Moon, 
  Sun, Calendar, Home, History, Terminal, Languages, LogOut,
  Mail, Phone
} from "lucide-react";

// Schema voor het formulier
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "Voornaam is verplicht" }),
  lastName: z.string().min(1, { message: "Achternaam is verplicht" }),
  email: z.string().email({ message: "Ongeldig e-mailadres" }),
  phone: z.string().optional(),
  profileImageUrl: z.string().optional(),
  language: z.string().optional(),
  darkMode: z.boolean().optional(),
  defaultPage: z.string().optional(),
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

// Demo gebruiker voor Administrator
const adminUser = {
  id: 1,
  firstName: "Ahmed",
  lastName: "Hassan",
  email: "ahmed.hassan@mymadrassa.nl",
  phone: "+31 6 12345678",
  role: "Administrator",
  avatar: "", // URL voor avatar indien beschikbaar
  language: "Nederlands",
  darkMode: false,
  defaultPage: "Dashboard",
  twoFactorEnabled: false,
  lastLogin: "10 mei 2025 14:30",
  notifyNewUsers: true,
  notifySystemUpdates: true,
  notifySecurityAlerts: true
};

// Demo gebruiker voor Docent
const teacherUser = {
  id: 2,
  firstName: "Fatima",
  lastName: "El Amrani",
  email: "fatima.elamrani@mymadrassa.nl",
  phone: "+31 6 87654321",
  role: "Docent",
  avatar: "", // URL voor avatar indien beschikbaar
  subjects: ["Arabisch", "Islamitische Studies"],
  classes: ["Groep 3A", "Groep 4B", "Groep 5A"],
  language: "Nederlands",
  darkMode: true,
  defaultPage: "Rooster",
  twoFactorEnabled: true,
  lastLogin: "11 mei 2025 09:15",
  notifyMessages: true,
  notifyScheduleChanges: true,
  notifyGrades: false,
  notifyAttendance: true
};

const MyAccount = () => {
  // Demonstratie: in een echte applicatie zou je deze informatie uit een API of auth context halen
  const [currentUser, setCurrentUser] = useState(adminUser); // of teacherUser
  const isAdmin = currentUser.role === "Administrator";
  const isTeacher = currentUser.role === "Docent";
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showPasswordChangedMessage, setShowPasswordChangedMessage] = useState(false);
  const [showNotificationSavedMessage, setShowNotificationSavedMessage] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser.twoFactorEnabled);
  const [darkMode, setDarkMode] = useState(currentUser.darkMode);
  const [selectedDefaultPage, setSelectedDefaultPage] = useState(currentUser.defaultPage);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: isTeacher 
      ? {
          messages: teacherUser.notifyMessages,
          scheduleChanges: teacherUser.notifyScheduleChanges,
          grades: teacherUser.notifyGrades,
          attendance: teacherUser.notifyAttendance
        }
      : {
          newUsers: adminUser.notifyNewUsers,
          systemUpdates: adminUser.notifySystemUpdates,
          securityAlerts: adminUser.notifySecurityAlerts
        },
    pushNotifications: true,
    desktopNotifications: true
  });
  
  // Formulier voor profielgegevens
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phone: currentUser.phone,
      language: currentUser.language,
      darkMode: currentUser.darkMode,
      defaultPage: currentUser.defaultPage,
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

  // Uitloggen
  const handleLogout = () => {
    alert("Uitloggen gesimuleerd voor demonstratie");
    // In een echte applicatie zou je hier de auth service gebruiken
    // authService.logout().then(() => navigate('/login'));
  };

  // Upload profielfoto
  const handleProfilePhotoUpload = () => {
    // Normaal zou dit een bestandskiezer openen
    alert("Profielfoto uploaden gesimuleerd voor demonstratie");
  };

  // Gebruik de ThemeProvider voor donkere modus
  const { theme, setTheme } = useTheme();
  
  // Bij initialisatie gebruiker in localStorage opslaan voor de sidebar
  // en de huidige themastand ophalen
  useEffect(() => {
    // Sla de huidige gebruiker op in localStorage voor sidebar en andere componenten
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Haal de huidige thema-instelling op uit de ThemeProvider
    // en synchroniseer de lokale 'darkMode' state hiermee
    setDarkMode(theme === 'dark');
  }, [theme, currentUser]);

  // Profiel opslaan
  const onProfileSubmit = (data: ProfileFormValues) => {
    setIsSaving(true);
    
    // Simuleer een API call
    setTimeout(() => {
      console.log("Profielgegevens bijgewerkt:", data);
      
      // Update de gebruiker met de nieuwe gegevens
      const updatedUser = {
        ...currentUser,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
      };
      
      setCurrentUser(updatedUser);
      
      // Update localStorage met de nieuwe gebruikersgegevens
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsSaving(false);
      setShowSavedMessage(true);
      
      // Verberg het bericht na 3 seconden
      setTimeout(() => {
        setShowSavedMessage(false);
      }, 3000);
    }, 800);
  };

  // Wachtwoord wijzigen
  const onPasswordSubmit = (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    
    // Simuleer een API call
    setTimeout(() => {
      console.log("Wachtwoord bijgewerkt:", data);
      
      setIsChangingPassword(false);
      setShowPasswordChangedMessage(true);
      
      // Reset form
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Verberg het bericht na 3 seconden
      setTimeout(() => {
        setShowPasswordChangedMessage(false);
      }, 3000);
    }, 800);
  };

  // Toggle tweefactorauthenticatie
  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  // Toggle donkere modus
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update de globale theme via de ThemeProvider
    setTheme(newDarkMode ? 'dark' : 'light');
    
    // We hoeven niets toe te voegen aan document.documentElement.classList
    // omdat de ThemeProvider dit automatisch doet
    
    // De ThemeProvider slaat de voorkeur al op in localStorage
  };

  // Verander standaardpagina
  const handleSelectDefaultPage = (page: string) => {
    setSelectedDefaultPage(page);
  };

  // Update notificatie-instellingen
  const handleToggleNotification = (type: string, subtype: string) => {
    if (type === 'email') {
      setNotificationSettings({
        ...notificationSettings,
        emailNotifications: {
          ...notificationSettings.emailNotifications,
          [subtype]: !notificationSettings.emailNotifications[subtype as keyof typeof notificationSettings.emailNotifications]
        }
      });
    } else {
      setNotificationSettings({
        ...notificationSettings,
        [type]: !notificationSettings[type as keyof typeof notificationSettings]
      });
    }
  };

  // Opslaan van voorkeuren
  const savePreferences = () => {
    setIsSaving(true);
    
    // Simuleer een API call
    setTimeout(() => {
      console.log("Voorkeuren opgeslagen:", {
        darkMode,
        defaultPage: selectedDefaultPage,
        language: profileForm.getValues().language
      });
      
      // Update de gebruiker met de nieuwe voorkeuren
      setCurrentUser({
        ...currentUser,
        darkMode,
        defaultPage: selectedDefaultPage
      });
      
      setIsSaving(false);
      setShowSavedMessage(true);
      
      // Verberg het bericht na 3 seconden
      setTimeout(() => {
        setShowSavedMessage(false);
      }, 3000);
    }, 800);
  };

  // Opslaan van notificatie-instellingen
  const saveNotificationSettings = () => {
    setIsSavingNotifications(true);
    
    // Simuleer een API call
    setTimeout(() => {
      console.log("Notificatie-instellingen opgeslagen:", notificationSettings);
      
      setIsSavingNotifications(false);
      setShowNotificationSavedMessage(true);
      
      // Verberg het bericht na 3 seconden
      setTimeout(() => {
        setShowNotificationSavedMessage(false);
      }, 3000);
    }, 800);
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mijn Account</h1>
            <p className="text-base text-gray-500 mt-1">Beheer hier uw accountinstellingen</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Tabs voor accountinstellingen */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Accountinstellingen</CardTitle>
            <CardDescription>
              Beheer uw accountinstellingen en voorkeuren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profiel" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6 bg-blue-900/10">
                <TabsTrigger value="profiel" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profiel
                </TabsTrigger>
                <TabsTrigger value="beveiliging" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Beveiliging
                </TabsTrigger>
                <TabsTrigger value="voorkeuren" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Voorkeuren
                </TabsTrigger>
                <TabsTrigger value="notificaties" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BellRing className="h-4 w-4 mr-2" />
                  Meldingen
                </TabsTrigger>
              </TabsList>

              {/* Profieltab inhoud */}
              <TabsContent value="profiel" className="space-y-6">
                {/* Sectie 1: Profielfoto en basisinformatie */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-28 h-28 mb-2">
                      <Avatar className="w-28 h-28 border-2 border-white shadow-md">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                          {currentUser.firstName[0]}{currentUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="absolute bottom-0 right-0 rounded-full p-1.5 bg-white shadow-sm"
                        onClick={handleProfilePhotoUpload}
                      >
                        <UploadCloud className="h-4 w-4 text-[#1e3a8a]" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">{currentUser.firstName} {currentUser.lastName}</p>
                      <div className="flex items-center justify-center text-sm text-gray-500 mt-1">
                        <UserCircle className="h-4 w-4 mr-1.5" />
                        {currentUser.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sectie 2: Profielgegevens bewerken */}
                <div>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Voornaam</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-gray-300" />
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
                                <Input {...field} className="border-gray-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-gray-300" />
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
                                <Input {...field} className="border-gray-300" />
                              </FormControl>
                              <FormDescription>Optioneel</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1">
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <div className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm text-gray-500 ring-offset-background">
                            {currentUser.role}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">De rol kan niet worden gewijzigd</p>
                        </FormItem>
                      </div>

                      {showSavedMessage && (
                        <div className="col-span-2">
                          <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                            ✓ Profielgegevens succesvol opgeslagen!
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Opslaan...
                            </>
                          ) : (
                            "Wijzigingen opslaan"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Beveiliging tab inhoud */}
              <TabsContent value="beveiliging" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Wachtwoord wijzigen</h3>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Huidig wachtwoord</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} className="border-gray-300" />
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
                                <Input type="password" {...field} className="border-gray-300" />
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
                                <Input type="password" {...field} className="border-gray-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {showPasswordChangedMessage && (
                          <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                            ✓ Wachtwoord succesvol gewijzigd!
                          </p>
                        )}
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? (
                              <>
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Wijzigen...
                              </>
                            ) : (
                              "Wachtwoord wijzigen"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Tweestapsverificatie</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Tweestapsverificatie is {currentUser.twoFactorEnabled ? 'ingeschakeld' : 'uitgeschakeld'}</p>
                        <p className="text-sm text-gray-500">Verhoog de beveiliging van uw account door tweestapsverificatie in te schakelen</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="twofa" 
                          checked={twoFactorEnabled} 
                          onCheckedChange={handleToggleTwoFactor}
                        />
                        <Label htmlFor="twofa">{twoFactorEnabled ? 'Aan' : 'Uit'}</Label>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(twoFactorEnabled ? 'Tweestapsverificatie beheren' : 'Tweestapsverificatie instellen')}
                      >
                        {twoFactorEnabled ? 'Beheren' : 'Instellen'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Voorkeuren tab inhoud */}
              <TabsContent value="voorkeuren" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Taal en weergave</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="language">Taal</Label>
                      <Select defaultValue={currentUser.language}>
                        <SelectTrigger id="language" className="border-gray-300">
                          <SelectValue placeholder="Selecteer een taal" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Nederlands">Nederlands</SelectItem>
                          <SelectItem value="Engels">Engels</SelectItem>
                          <SelectItem value="Arabisch">Arabisch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="darkmode">Donkere modus</Label>
                        <p className="text-sm text-muted-foreground">Schakel tussen lichte en donkere weergave</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="darkmode" 
                          checked={darkMode} 
                          onCheckedChange={handleToggleDarkMode}
                        />
                        <div className="flex items-center space-x-1">
                          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {showSavedMessage && (
                  <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                    ✓ Voorkeuren succesvol opgeslagen!
                  </p>
                )}
                <div className="flex justify-end">
                  <Button 
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                    onClick={savePreferences}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Opslaan...
                      </>
                    ) : (
                      "Voorkeuren opslaan"
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Notificaties tab inhoud */}
              <TabsContent value="notificaties" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">E-mailnotificaties</h3>
                  <div className="space-y-3">
                    {isTeacher ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifyMessages">Nieuwe berichten</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail wanneer u een nieuw bericht ontvangt</p>
                          </div>
                          <Switch 
                            id="notifyMessages" 
                            checked={notificationSettings.emailNotifications.messages} 
                            onCheckedChange={() => handleToggleNotification('email', 'messages')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifySchedule">Roosterwijzigingen</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail bij wijzigingen in het rooster</p>
                          </div>
                          <Switch 
                            id="notifySchedule" 
                            checked={notificationSettings.emailNotifications.scheduleChanges} 
                            onCheckedChange={() => handleToggleNotification('email', 'scheduleChanges')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifyGrades">Cijferregistratie</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail bij bevestiging van cijferregistratie</p>
                          </div>
                          <Switch 
                            id="notifyGrades" 
                            checked={notificationSettings.emailNotifications.grades} 
                            onCheckedChange={() => handleToggleNotification('email', 'grades')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifyAttendance">Aanwezigheidsregistratie</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail met een overzicht van aanwezigheidsregistratie</p>
                          </div>
                          <Switch 
                            id="notifyAttendance" 
                            checked={notificationSettings.emailNotifications.attendance} 
                            onCheckedChange={() => handleToggleNotification('email', 'attendance')}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifyNewUsers">Nieuwe gebruikers</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail wanneer nieuwe gebruikers worden geregistreerd</p>
                          </div>
                          <Switch 
                            id="notifyNewUsers" 
                            checked={notificationSettings.emailNotifications.newUsers} 
                            onCheckedChange={() => handleToggleNotification('email', 'newUsers')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifySystemUpdates">Systeemupdates</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail over belangrijke systeemupdates</p>
                          </div>
                          <Switch 
                            id="notifySystemUpdates" 
                            checked={notificationSettings.emailNotifications.systemUpdates} 
                            onCheckedChange={() => handleToggleNotification('email', 'systemUpdates')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="notifySecurityAlerts">Beveiligingsnotificaties</Label>
                            <p className="text-sm text-muted-foreground">Ontvang een e-mail bij belangrijke beveiligingsgebeurtenissen</p>
                          </div>
                          <Switch 
                            id="notifySecurityAlerts" 
                            checked={notificationSettings.emailNotifications.securityAlerts} 
                            onCheckedChange={() => handleToggleNotification('email', 'securityAlerts')}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">In-app notificaties</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotifications">Push notificaties</Label>
                        <p className="text-sm text-muted-foreground">Ontvang push notificaties op uw apparaat</p>
                      </div>
                      <Switch 
                        id="pushNotifications" 
                        checked={notificationSettings.pushNotifications} 
                        onCheckedChange={() => handleToggleNotification('pushNotifications', '')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="desktopNotifications">Desktop notificaties</Label>
                        <p className="text-sm text-muted-foreground">Ontvang notificaties in uw browser (alleen desktop)</p>
                      </div>
                      <Switch 
                        id="desktopNotifications" 
                        checked={notificationSettings.desktopNotifications} 
                        onCheckedChange={() => handleToggleNotification('desktopNotifications', '')}
                      />
                    </div>
                  </div>
                </div>

                {showNotificationSavedMessage && (
                  <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                    ✓ Meldingsinstellingen succesvol opgeslagen!
                  </p>
                )}
                <div className="flex justify-end">
                  <Button 
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                    onClick={saveNotificationSettings}
                    disabled={isSavingNotifications}
                  >
                    {isSavingNotifications ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Opslaan...
                      </>
                    ) : (
                      "Meldingsinstellingen opslaan"
                    )}
                  </Button>
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