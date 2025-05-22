import React, { useState, useEffect } from "react";
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
  UserCircle, KeyRound, BellRing, 
  Settings, UploadCloud, 
  LogOut, Mail, Phone
} from "lucide-react";

// Schema voor het formulier
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "Voornaam is verplicht" }),
  lastName: z.string().min(1, { message: "Achternaam is verplicht" }),
  email: z.string().email({ message: "Ongeldig e-mailadres" }),
  phone: z.string().optional(),
  language: z.string().optional(),
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
  
  // Bij initialisatie gebruiker in localStorage opslaan voor de sidebar
  useEffect(() => {
    // Sla de huidige gebruiker op in localStorage voor sidebar en andere componenten
    localStorage.setItem('user', JSON.stringify(currentUser));
  }, [currentUser]);

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
              <TabsList className="grid grid-cols-3 mb-6 bg-blue-900/10">
                <TabsTrigger value="profiel" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profiel
                </TabsTrigger>
                <TabsTrigger value="beveiliging" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Beveiliging
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={profileForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Taal</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Selecteer een taal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Nederlands">Nederlands</SelectItem>
                                  <SelectItem value="Engels">Engels</SelectItem>
                                  <SelectItem value="Arabisch">Arabisch</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="defaultPage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Startpagina</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Selecteer een startpagina" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Dashboard">Dashboard</SelectItem>
                                  <SelectItem value="Leerlingen">Leerlingen</SelectItem>
                                  <SelectItem value="Klassen">Klassen</SelectItem>
                                  <SelectItem value="Vakken">Vakken</SelectItem>
                                  <SelectItem value="Rooster">Rooster</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end mt-6">
                        {showSavedMessage && (
                          <div className="mr-4 px-3 py-2 rounded-md bg-blue-100 text-blue-700 flex items-center">
                            Wijzigingen opgeslagen
                          </div>
                        )}
                        <Button 
                          type="submit" 
                          disabled={isSaving || !profileForm.formState.isDirty}
                          className="bg-[#1e3a8a] text-white hover:bg-blue-700 transition-colors"
                        >
                          {isSaving ? "Bezig met opslaan..." : "Opslaan"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Beveiligingstab inhoud */}
              <TabsContent value="beveiliging" className="space-y-6">
                {/* Sectie 1: Account beveiliging */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                  <h3 className="text-lg font-medium mb-3">Accountbeveiliging</h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label htmlFor="two-factor" className="font-medium text-base">
                            Tweefactorauthenticatie
                          </Label>
                        </div>
                        <p className="text-sm text-gray-500">
                          Beveilig uw account met 2FA-authenticatie.
                        </p>
                      </div>
                      <Switch 
                        id="two-factor" 
                        checked={twoFactorEnabled}
                        onCheckedChange={handleToggleTwoFactor}
                      />
                    </div>
                  </div>
                </div>

                {/* Sectie 2: Wachtwoord wijzigen */}
                <div className="bg-white rounded-lg mb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Wachtwoord wijzigen</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Zorg ervoor dat uw account een sterk wachtwoord gebruikt dat u nergens anders gebruikt.
                    </p>
                    
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                <FormLabel>Bevestig wachtwoord</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} className="border-gray-300" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          {showPasswordChangedMessage && (
                            <div className="mr-4 px-3 py-2 rounded-md bg-blue-100 text-blue-700 flex items-center">
                              Wachtwoord gewijzigd
                            </div>
                          )}
                          <Button 
                            type="submit" 
                            disabled={isChangingPassword || !passwordForm.formState.isDirty}
                            className="bg-[#1e3a8a] text-white hover:bg-blue-700 transition-colors"
                          >
                            {isChangingPassword ? "Bezig met wijzigen..." : "Wachtwoord wijzigen"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              </TabsContent>

              {/* Notificaties tab inhoud */}
              <TabsContent value="notificaties" className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                  <h3 className="text-lg font-medium mb-3">E-mailmeldingen</h3>
                  <div className="space-y-4">
                    {isTeacher ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Nieuwe berichten
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail wanneer u een nieuw bericht ontvangt.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.messages}
                            onCheckedChange={() => handleToggleNotification('email', 'messages')}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Roosterwijzigingen
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail bij wijzigingen in uw rooster.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.scheduleChanges}
                            onCheckedChange={() => handleToggleNotification('email', 'scheduleChanges')}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Cijfermeldingen
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail wanneer u nieuwe cijfers invoert of wijzigt.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.grades}
                            onCheckedChange={() => handleToggleNotification('email', 'grades')}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Aanwezigheidsmeldingen
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail bij afwezigheid van leerlingen.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.attendance}
                            onCheckedChange={() => handleToggleNotification('email', 'attendance')}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Nieuwe gebruikers
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail wanneer er nieuwe gebruikers worden aangemaakt.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.newUsers}
                            onCheckedChange={() => handleToggleNotification('email', 'newUsers')}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Systeemupdates
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail over belangrijke systeemupdates.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.systemUpdates}
                            onCheckedChange={() => handleToggleNotification('email', 'systemUpdates')}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-base">
                              Beveiligingswaarschuwingen
                            </Label>
                            <p className="text-sm text-gray-500">
                              Ontvang een e-mail bij verdachte aanmeldingen of beveiligingsproblemen.
                            </p>
                          </div>
                          <Switch 
                            checked={notificationSettings.emailNotifications.securityAlerts}
                            onCheckedChange={() => handleToggleNotification('email', 'securityAlerts')}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                  <h3 className="text-lg font-medium mb-3">App-meldingen</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-base">
                          Push-meldingen
                        </Label>
                        <p className="text-sm text-gray-500">
                          Ontvang push-meldingen op uw mobiele apparaat.
                        </p>
                      </div>
                      <Switch 
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={() => handleToggleNotification('pushNotifications', '')}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-base">
                          Desktop-meldingen
                        </Label>
                        <p className="text-sm text-gray-500">
                          Ontvang meldingen in uw browser wanneer u bent ingelogd.
                        </p>
                      </div>
                      <Switch 
                        checked={notificationSettings.desktopNotifications}
                        onCheckedChange={() => handleToggleNotification('desktopNotifications', '')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  {showNotificationSavedMessage && (
                    <div className="mr-4 px-3 py-2 rounded-md bg-blue-100 text-blue-700 flex items-center">
                      Meldingsinstellingen opgeslagen
                    </div>
                  )}
                  <Button 
                    type="button"
                    onClick={saveNotificationSettings}
                    disabled={isSavingNotifications}
                    className="bg-[#1e3a8a] text-white hover:bg-blue-700 transition-colors"
                  >
                    {isSavingNotifications ? "Bezig met opslaan..." : "Instellingen opslaan"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Uitlogknop */}
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;