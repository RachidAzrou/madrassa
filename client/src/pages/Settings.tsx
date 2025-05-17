import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Lock, 
  Building2, 
  UploadCloud
} from "lucide-react";

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  // Demo gebruiker voor rolgebaseerde weergave
  const [userRole, setUserRole] = useState("admin"); // 'admin' of 'teacher'
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher";
  
  // Systeeminstellingen
  const [language, setLanguage] = useState("nl");
  const [theme, setTheme] = useState("light");
  const [dateFormat, setDateFormat] = useState("dd-mm-yyyy");
  const [timeFormat, setTimeFormat] = useState("24h");
  
  // E-mailinstellingen
  const [emailSettings, setEmailSettings] = useState({
    dailySummary: true,
    weeklyReport: true,
    studentAlerts: true,
    systemAlerts: false,
    marketingEmails: false
  });

  // Meldinginstellingen
  const [notificationSettings, setNotificationSettings] = useState({
    browserNotifications: true,
    soundAlerts: true,
    desktopNotifications: false
  });

  // Instellingen voor school
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: "myMadrassa",
    contactEmail: "info@mymadrassa.nl",
    phone: "+31 6 12345678",
    address: "Amsterdamseweg 123, 1234 AB Amsterdam",
    logoUrl: ""
  });

  // Functie om systeeminstellingen op te slaan
  const saveSettings = () => {
    setIsSaving(true);
    
    // Simuleer een API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedMessage(true);
      
      // Verberg de melding na 3 seconden
      setTimeout(() => {
        setShowSavedMessage(false);
      }, 3000);
    }, 800);
  };

  // Functie om een schakelaar te wijzigen
  const handleToggle = (category: string, setting: string) => {
    if (category === 'email') {
      setEmailSettings({
        ...emailSettings,
        [setting]: !emailSettings[setting as keyof typeof emailSettings]
      });
    } else if (category === 'notification') {
      setNotificationSettings({
        ...notificationSettings,
        [setting]: !notificationSettings[setting as keyof typeof notificationSettings]
      });
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          <SettingsIcon className="mr-2 h-6 w-6 text-[#1e3a8a]" /> Instellingen
        </h1>
        
        {/* Demo-schakelaar tussen admin/docent - alleen voor demonstratie */}
        <Button variant="outline" size="sm" onClick={() => setUserRole(userRole === "admin" ? "teacher" : "admin")}>
          Wissel naar {userRole === "admin" ? "Docent" : "Administrator"} weergave
        </Button>
      </div>

      <Tabs defaultValue="algemeen" className="w-full">
        <TabsList className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} w-full mb-6 bg-blue-900/10`}>
          <TabsTrigger value="algemeen" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="h-4 w-4 mr-2" />
            Algemeen
          </TabsTrigger>
          <TabsTrigger value="meldingen" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4 mr-2" />
            Meldingen
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="beveiliging" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Lock className="h-4 w-4 mr-2" />
              Beveiliging
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="school" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Building2 className="h-4 w-4 mr-2" />
              School
            </TabsTrigger>
          )}
        </TabsList>

        {/* Algemene instellingen */}
        <TabsContent value="algemeen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algemene instellingen</CardTitle>
              <CardDescription>
                Configureer de algemene instellingen van het systeem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Taal</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Selecteer taal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nl">Nederlands</SelectItem>
                        <SelectItem value="en">Engels</SelectItem>
                        <SelectItem value="ar">Arabisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Thema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Selecteer thema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Licht</SelectItem>
                        <SelectItem value="dark">Donker</SelectItem>
                        <SelectItem value="system">Systeemvoorkeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Datumnotatie</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Selecteer datumnotatie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd-mm-yyyy">DD-MM-JJJJ</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM-DD-JJJJ</SelectItem>
                        <SelectItem value="yyyy-mm-dd">JJJJ-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Tijdnotatie</Label>
                    <Select value={timeFormat} onValueChange={setTimeFormat}>
                      <SelectTrigger id="timeFormat">
                        <SelectValue placeholder="Selecteer tijdnotatie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-uurs (14:30)</SelectItem>
                        <SelectItem value="12h">12-uurs (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {showSavedMessage && (
                <p className="text-sm text-green-600 mt-2">Instellingen succesvol opgeslagen!</p>
              )}
              <Button 
                onClick={saveSettings} 
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 mt-4"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Opslaan...
                  </>
                ) : (
                  "Instellingen opslaan"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meldinginstellingen */}
        <TabsContent value="meldingen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meldinginstellingen</CardTitle>
              <CardDescription>
                Beheer uw melding- en e-mailinstellingen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">E-mailmeldingen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dailySummary">Dagelijkse samenvatting</Label>
                      <p className="text-sm text-muted-foreground">Ontvang een dagelijkse samenvatting van activiteiten</p>
                    </div>
                    <Switch 
                      id="dailySummary" 
                      checked={emailSettings.dailySummary}
                      onCheckedChange={() => handleToggle('email', 'dailySummary')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReport">Wekelijks rapport</Label>
                      <p className="text-sm text-muted-foreground">Ontvang een wekelijks rapport van statistieken en voortgang</p>
                    </div>
                    <Switch 
                      id="weeklyReport" 
                      checked={emailSettings.weeklyReport}
                      onCheckedChange={() => handleToggle('email', 'weeklyReport')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="studentAlerts">Studentmeldingen</Label>
                      <p className="text-sm text-muted-foreground">Ontvang meldingen over studentactiviteiten</p>
                    </div>
                    <Switch 
                      id="studentAlerts" 
                      checked={emailSettings.studentAlerts}
                      onCheckedChange={() => handleToggle('email', 'studentAlerts')}
                    />
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="systemAlerts">Systeemmeldingen</Label>
                          <p className="text-sm text-muted-foreground">Ontvang meldingen over systeemwijzigingen</p>
                        </div>
                        <Switch 
                          id="systemAlerts" 
                          checked={emailSettings.systemAlerts}
                          onCheckedChange={() => handleToggle('email', 'systemAlerts')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketingEmails">Marketingberichten</Label>
                          <p className="text-sm text-muted-foreground">Ontvang updates over nieuwe functies en aanbiedingen</p>
                        </div>
                        <Switch 
                          id="marketingEmails" 
                          checked={emailSettings.marketingEmails}
                          onCheckedChange={() => handleToggle('email', 'marketingEmails')}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Browsermeldingen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browserNotifications">Browsermeldingen</Label>
                      <p className="text-sm text-muted-foreground">Ontvang meldingen in uw browser</p>
                    </div>
                    <Switch 
                      id="browserNotifications" 
                      checked={notificationSettings.browserNotifications}
                      onCheckedChange={() => handleToggle('notification', 'browserNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="soundAlerts">Geluidsmelding</Label>
                      <p className="text-sm text-muted-foreground">Speel een geluid af bij nieuwe meldingen</p>
                    </div>
                    <Switch 
                      id="soundAlerts" 
                      checked={notificationSettings.soundAlerts}
                      onCheckedChange={() => handleToggle('notification', 'soundAlerts')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="desktopNotifications">Desktopmeldingen</Label>
                      <p className="text-sm text-muted-foreground">Ontvang meldingen op uw desktop</p>
                    </div>
                    <Switch 
                      id="desktopNotifications" 
                      checked={notificationSettings.desktopNotifications}
                      onCheckedChange={() => handleToggle('notification', 'desktopNotifications')}
                    />
                  </div>
                </div>
              </div>

              {showSavedMessage && (
                <p className="text-sm text-green-600 mt-2">Instellingen succesvol opgeslagen!</p>
              )}
              <Button 
                onClick={saveSettings} 
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 mt-4"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Opslaan...
                  </>
                ) : (
                  "Instellingen opslaan"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beveiligingsinstellingen - alleen zichtbaar voor administrators */}
        {isAdmin && (
          <TabsContent value="beveiliging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Beveiligingsinstellingen</CardTitle>
                <CardDescription>
                  Beheer de beveiligingsinstellingen van het systeem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Accountbeveiliging</h3>
                    <div className="space-y-4">
                      <Button variant="outline">Wachtwoordbeleid configureren</Button>
                      <Button variant="outline">Tweefactorauthenticatie vereisen</Button>
                      <Button variant="outline">API-sleutels beheren</Button>
                      <Button variant="outline">Beperkingen voor IP-adressen instellen</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Gebruikersmachtigingen</h3>
                    <div className="space-y-4">
                      <Button variant="outline">Rollen en machtigingen beheren</Button>
                      <Button variant="outline">Gebruikerstoegang controleren</Button>
                      <Button variant="outline">Gegevenstoegangsregels configureren</Button>
                      <Button variant="outline">Standaard gebruikersrollen instellen</Button>
                    </div>
                  </div>
                </div>

                {showSavedMessage && (
                  <p className="text-sm text-green-600 mt-2">Instellingen succesvol opgeslagen!</p>
                )}
                <Button 
                  onClick={saveSettings} 
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 mt-4"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Opslaan...
                    </>
                  ) : (
                    "Instellingen opslaan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Schoolinstellingen - alleen zichtbaar voor administrators */}
        {isAdmin && (
          <TabsContent value="school" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schoolinstellingen</CardTitle>
                <CardDescription>
                  Beheer de instellingen van uw school.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Naam van de school</Label>
                    <input
                      type="text"
                      id="schoolName"
                      value={schoolSettings.schoolName}
                      onChange={(e) => setSchoolSettings({...schoolSettings, schoolName: e.target.value})}
                      className="w-full p-2 rounded-md border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact e-mail</Label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={schoolSettings.contactEmail}
                      onChange={(e) => setSchoolSettings({...schoolSettings, contactEmail: e.target.value})}
                      className="w-full p-2 rounded-md border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <input
                      type="tel"
                      id="phone"
                      value={schoolSettings.phone}
                      onChange={(e) => setSchoolSettings({...schoolSettings, phone: e.target.value})}
                      className="w-full p-2 rounded-md border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <input
                      type="text"
                      id="address"
                      value={schoolSettings.address}
                      onChange={(e) => setSchoolSettings({...schoolSettings, address: e.target.value})}
                      className="w-full p-2 rounded-md border border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Schoollogo</Label>
                  <div className="mt-2">
                    <Button variant="outline" type="button">
                      <UploadCloud className="mr-2 h-4 w-4" /> Logo uploaden
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Academische instellingen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline">Vakken beheren</Button>
                    <Button variant="outline">Klassen configureren</Button>
                    <Button variant="outline">Beoordelingssysteem instellen</Button>
                    <Button variant="outline">Lesroosterconfiguratie</Button>
                  </div>
                </div>

                {showSavedMessage && (
                  <p className="text-sm text-green-600 mt-2">Instellingen succesvol opgeslagen!</p>
                )}
                <Button 
                  onClick={saveSettings} 
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 mt-4"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Opslaan...
                    </>
                  ) : (
                    "Instellingen opslaan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;