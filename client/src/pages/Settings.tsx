import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, Palette, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumHeader } from '@/components/layout/premium-header';

export default function Settings() {
  const [settings, setSettings] = useState({
    // Notificatie instellingen
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: true,
    
    // Beveiliging
    twoFactorAuth: false,
    sessionTimeout: '30',
    
    // Systeem
    language: 'nl',
    timezone: 'Europe/Amsterdam',
    dateFormat: 'dd-mm-yyyy',
    
    // School instellingen
    schoolName: 'myMadrassa',
    schoolEmail: 'info@mymadrassa.nl',
    schoolPhone: '+31 20 1234567',
    schoolAddress: 'Schoolstraat 1, 1000 AB Amsterdam'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Hier zou je de instellingen opslaan naar de backend
    console.log('Instellingen opgeslagen:', settings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumHeader
        title="Instellingen"
        description="Beheer systeeminstellingen en voorkeuren"
        icon={SettingsIcon}
        breadcrumbs={{
          current: "Instellingen"
        }}
      />

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notificaties</TabsTrigger>
            <TabsTrigger value="security">Beveiliging</TabsTrigger>
            <TabsTrigger value="system">Systeem</TabsTrigger>
            <TabsTrigger value="school">School</TabsTrigger>
          </TabsList>

          {/* Notificaties Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#1e40af]" />
                  Notificatie Instellingen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">E-mail notificaties</Label>
                    <p className="text-sm text-gray-500">Ontvang updates via e-mail</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push notificaties</Label>
                    <p className="text-sm text-gray-500">Ontvang browser notificaties</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS notificaties</Label>
                    <p className="text-sm text-gray-500">Ontvang belangrijke updates via SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(value) => handleSettingChange('smsNotifications', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Beveiliging Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#1e40af]" />
                  Beveiligingsinstellingen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Twee-factor authenticatie</Label>
                    <p className="text-sm text-gray-500">Extra beveiliging voor je account</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(value) => handleSettingChange('twoFactorAuth', value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Sessie timeout (minuten)</Label>
                  <Select
                    value={settings.sessionTimeout}
                    onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minuten</SelectItem>
                      <SelectItem value="30">30 minuten</SelectItem>
                      <SelectItem value="60">1 uur</SelectItem>
                      <SelectItem value="120">2 uur</SelectItem>
                      <SelectItem value="0">Nooit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Wachtwoord wijzigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Systeem Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#1e40af]" />
                  Systeeminstellingen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Taal</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nl">Nederlands</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Tijdzone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => handleSettingChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Amsterdam">Amsterdam (CET)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Datumformaat</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) => handleSettingChange('dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Tab */}
          <TabsContent value="school" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#1e40af]" />
                  School Instellingen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Schoolnaam</Label>
                    <Input
                      id="schoolName"
                      value={settings.schoolName}
                      onChange={(e) => handleSettingChange('schoolName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">School e-mail</Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={settings.schoolEmail}
                      onChange={(e) => handleSettingChange('schoolEmail', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">School telefoon</Label>
                    <Input
                      id="schoolPhone"
                      value={settings.schoolPhone}
                      onChange={(e) => handleSettingChange('schoolPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">School adres</Label>
                  <Input
                    id="schoolAddress"
                    value={settings.schoolAddress}
                    onChange={(e) => handleSettingChange('schoolAddress', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Opslaan knop */}
        <div className="flex justify-end pt-6">
          <Button 
            onClick={handleSave}
            className="bg-[#1e40af] hover:bg-[#1e40af]/90"
          >
            Instellingen opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}