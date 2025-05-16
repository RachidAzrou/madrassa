import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings as SettingsIcon, Server, Globe, Users, Bell, Shield, Database, Mail, Brush } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('algemeen');
  
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    staleTime: 60000,
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <SettingsIcon className="h-6 w-6 text-primary mr-3" />
            <h1 className="text-2xl font-semibold text-primary">Instellingen</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-9">
            Configureer systeeminstellingen en voorkeuren
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 h-auto">
          <TabsTrigger value="algemeen" className="flex items-center gap-2 py-2 px-3">
            <SettingsIcon className="h-4 w-4" />
            <span>Algemeen</span>
          </TabsTrigger>
          <TabsTrigger value="academisch" className="flex items-center gap-2 py-2 px-3">
            <Globe className="h-4 w-4" />
            <span>Academisch</span>
          </TabsTrigger>
          <TabsTrigger value="gebruikers" className="flex items-center gap-2 py-2 px-3">
            <Users className="h-4 w-4" />
            <span>Gebruikers</span>
          </TabsTrigger>
          <TabsTrigger value="meldingen" className="flex items-center gap-2 py-2 px-3">
            <Bell className="h-4 w-4" />
            <span>Meldingen</span>
          </TabsTrigger>
          <TabsTrigger value="beveiliging" className="flex items-center gap-2 py-2 px-3">
            <Shield className="h-4 w-4" />
            <span>Beveiliging</span>
          </TabsTrigger>
          <TabsTrigger value="integraties" className="flex items-center gap-2 py-2 px-3">
            <Server className="h-4 w-4" />
            <span>Integraties</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Algemene Instellingen */}
        <TabsContent value="algemeen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basis Informatie</CardTitle>
              <CardDescription>Bewerk de algemene instellingen van de instelling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school-name">Naam Instelling</Label>
                  <Input id="school-name" placeholder="Voer de naam van de instelling in" defaultValue="EduManage Academie" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-code">Code Instelling</Label>
                  <Input id="school-code" placeholder="Voer de code van de instelling in" defaultValue="EMA-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-email">Email</Label>
                  <Input id="school-email" type="email" placeholder="Voer het email adres in" defaultValue="info@edumanage.nl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-phone">Telefoonnummer</Label>
                  <Input id="school-phone" placeholder="Voer het telefoonnummer in" defaultValue="020-1234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-address">Adres</Label>
                  <Input id="school-address" placeholder="Voer het adres in" defaultValue="Schoolstraat 123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-city">Stad</Label>
                  <Input id="school-city" placeholder="Voer de stad in" defaultValue="Amsterdam" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Systeem Voorkeuren</CardTitle>
              <CardDescription>Configureer taal en uiterlijk instellingen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Standaard Taal</Label>
                  <Select defaultValue="nl">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een taal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="en">Engels</SelectItem>
                      <SelectItem value="de">Duits</SelectItem>
                      <SelectItem value="fr">Frans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Tijdzone</Label>
                  <Select defaultValue="europe_amsterdam">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een tijdzone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe_amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="europe_london">Europe/London</SelectItem>
                      <SelectItem value="america_new_york">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Datumformaat</Label>
                  <Select defaultValue="dd_mm_yyyy">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een datumformaat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd_mm_yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="mm_dd_yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="yyyy_mm_dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Thema</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een thema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Licht</SelectItem>
                      <SelectItem value="dark">Donker</SelectItem>
                      <SelectItem value="system">Systeemvoorkeur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Onderhoudsmodus</Label>
                    <p className="text-sm text-gray-500">Schakel de onderhoudsmodus in tijdens updates</p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Debug Modus</Label>
                    <p className="text-sm text-gray-500">Schakel uitgebreide logging in voor probleemoplossing</p>
                  </div>
                  <Switch id="debug-mode" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Academische Instellingen */}
        <TabsContent value="academisch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academische Periode</CardTitle>
              <CardDescription>Beheer academisch jaar en periode instellingen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current-year">Huidig Academisch Jaar</Label>
                  <Select defaultValue="2024_2025">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een academisch jaar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024_2025">2024-2025</SelectItem>
                      <SelectItem value="2023_2024">2023-2024</SelectItem>
                      <SelectItem value="2022_2023">2022-2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-term">Huidige Periode</Label>
                  <Select defaultValue="fall">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">Najaar</SelectItem>
                      <SelectItem value="spring">Voorjaar</SelectItem>
                      <SelectItem value="summer">Zomer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Periodestructuur</Label>
                <RadioGroup defaultValue="semester" className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semester" id="semester" />
                    <Label htmlFor="semester">Semester Systeem</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trimester" id="trimester" />
                    <Label htmlFor="trimester">Trimester Systeem</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarter" id="quarter" />
                    <Label htmlFor="quarter">Kwartaal Systeem</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Academische Kalender</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Datum</Label>
                    <Input id="start-date" type="date" defaultValue="2024-09-01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Eind Datum</Label>
                    <Input id="end-date" type="date" defaultValue="2025-06-30" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beoordelingssysteem</CardTitle>
              <CardDescription>Configureer cijferschalen en beoordelingsmethoden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cijferschaal</Label>
                <RadioGroup defaultValue="percentage" className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentages (0-100%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="letter" id="letter" />
                    <Label htmlFor="letter">Letterschaal (A, B, C, D, F)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="numeric" id="numeric" />
                    <Label htmlFor="numeric">Numeriek (1-10)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Minimum Slagingscijfer</Label>
                <div className="flex items-center space-x-4">
                  <Input className="max-w-[80px]" defaultValue="5.5" />
                  <span className="text-sm text-gray-500">Studenten moeten minstens dit cijfer halen om te slagen</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weighted-grades">Gewogen Cijfers</Label>
                    <p className="text-sm text-gray-500">Cijfers tellen mee op basis van studiepunten</p>
                  </div>
                  <Switch id="weighted-grades" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Gebruikers Instellingen */}
        <TabsContent value="gebruikers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikersrollen</CardTitle>
              <CardDescription>Beheer gebruikersrollen en rechten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-sm text-gray-500">Volledige toegang tot alle functies</p>
                  </div>
                  <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">Systeem</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Docent</p>
                    <p className="text-sm text-gray-500">Toegang tot cursussen, cijfers en aanwezigheid</p>
                  </div>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">Academisch</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Student</p>
                    <p className="text-sm text-gray-500">Beperkte toegang tot eigen gegevens en cursussen</p>
                  </div>
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Basis</Badge>
                </div>
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <p className="font-medium">Ouder/Verzorger</p>
                    <p className="text-sm text-gray-500">Toegang tot gegevens van verbonden studenten</p>
                  </div>
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">Beperkt</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Rol Toevoegen</Button>
              <Button>Rechten Beheren</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aanmeldingsopties</CardTitle>
              <CardDescription>Configureer gebruikersregistratie en aanmeldingsinstellingen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="self-registration">Zelfregistratie</Label>
                    <p className="text-sm text-gray-500">Sta nieuwe gebruikers toe om zelf een account aan te maken</p>
                  </div>
                  <Switch id="self-registration" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-verification">Email Verificatie</Label>
                    <p className="text-sm text-gray-500">Verplicht email verificatie voor nieuwe accounts</p>
                  </div>
                  <Switch id="email-verification" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password-complexity">Complexe Wachtwoorden</Label>
                    <p className="text-sm text-gray-500">Vereist complexe wachtwoorden (min. 8 tekens, hoofdletters, cijfers)</p>
                  </div>
                  <Switch id="password-complexity" defaultChecked />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="password-expiry">Wachtwoord Verlooptijd</Label>
                <Select defaultValue="90">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dagen</SelectItem>
                    <SelectItem value="60">60 dagen</SelectItem>
                    <SelectItem value="90">90 dagen</SelectItem>
                    <SelectItem value="never">Nooit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Meldingen Instellingen */}
        <TabsContent value="meldingen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Meldingen</CardTitle>
              <CardDescription>Configureer welke meldingen via email worden verzonden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="grade-notifications">Cijfermeldingen</Label>
                    <p className="text-sm text-gray-500">Stuur meldingen bij nieuwe cijfers</p>
                  </div>
                  <Switch id="grade-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="attendance-notifications">Aanwezigheidsmeldingen</Label>
                    <p className="text-sm text-gray-500">Stuur meldingen bij afwezigheid</p>
                  </div>
                  <Switch id="attendance-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="course-notifications">Cursusmeldingen</Label>
                    <p className="text-sm text-gray-500">Stuur meldingen bij wijzigingen in cursussen</p>
                  </div>
                  <Switch id="course-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="event-notifications">Evenementmeldingen</Label>
                    <p className="text-sm text-gray-500">Stuur meldingen over aankomende evenementen</p>
                  </div>
                  <Switch id="event-notifications" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Configuratie</CardTitle>
              <CardDescription>Configureer SMTP-instellingen voor uitgaande emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" placeholder="smtp.example.com" defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Poort</Label>
                  <Input id="smtp-port" placeholder="587" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">SMTP Gebruikersnaam</Label>
                  <Input id="smtp-username" placeholder="gebruiker@example.com" defaultValue="notifications@edumanage.nl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Wachtwoord</Label>
                  <Input id="smtp-password" type="password" placeholder="••••••••" defaultValue="••••••••" />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="sender-name">Afzendernaam</Label>
                <Input id="sender-name" placeholder="Naam Afzender" defaultValue="EduManage Notificaties" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-email">Afzender Email</Label>
                <Input id="sender-email" placeholder="noreply@example.com" defaultValue="noreply@edumanage.nl" />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="use-ssl">Gebruik SSL/TLS</Label>
                  <p className="text-sm text-gray-500">Versleutel email communicatie</p>
                </div>
                <Switch id="use-ssl" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Test Verbinding</Button>
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Beveiliging Instellingen */}
        <TabsContent value="beveiliging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Veiligheidsbeleid</CardTitle>
              <CardDescription>Configureer veiligheidsinstellingen en beleid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Tweefactorauthenticatie (2FA)</Label>
                    <p className="text-sm text-gray-500">Verplicht 2FA voor belangrijke gebruikersrollen</p>
                  </div>
                  <Switch id="two-factor" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-restriction">IP Beperkingen</Label>
                    <p className="text-sm text-gray-500">Beperk toegang tot specifieke IP-adressen</p>
                  </div>
                  <Switch id="ip-restriction" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-timeout">Sessie Timeout</Label>
                    <p className="text-sm text-gray-500">Automatisch uitloggen na inactiviteit</p>
                  </div>
                  <Switch id="session-timeout" defaultChecked />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="timeout-duration">Timeout Duur</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een duur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minuten</SelectItem>
                    <SelectItem value="30">30 minuten</SelectItem>
                    <SelectItem value="60">60 minuten</SelectItem>
                    <SelectItem value="120">2 uur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="failed-attempts">Max. Mislukte Aanmeldingspogingen</Label>
                <Select defaultValue="5">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer aantal pogingen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 pogingen</SelectItem>
                    <SelectItem value="5">5 pogingen</SelectItem>
                    <SelectItem value="10">10 pogingen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Privacy</CardTitle>
              <CardDescription>Configureer dataprivacy-instellingen en GDPR-compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Bewaarbeleid</Label>
                <RadioGroup defaultValue="2_years" className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1_year" id="1_year" />
                    <Label htmlFor="1_year">1 jaar na uitschrijving</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2_years" id="2_years" />
                    <Label htmlFor="2_years">2 jaar na uitschrijving</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5_years" id="5_years" />
                    <Label htmlFor="5_years">5 jaar na uitschrijving</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indefinite" id="indefinite" />
                    <Label htmlFor="indefinite">Bewaar onbeperkt</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-export">Toestaan Data Export</Label>
                    <p className="text-sm text-gray-500">Sta gebruikers toe hun persoonlijke gegevens te exporteren</p>
                  </div>
                  <Switch id="data-export" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-delete">Toestaan Data Verwijdering</Label>
                    <p className="text-sm text-gray-500">Sta gebruikers toe hun persoonlijke gegevens te laten verwijderen</p>
                  </div>
                  <Switch id="data-delete" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cookie-consent">Cookie Toestemming</Label>
                    <p className="text-sm text-gray-500">Vraag expliciet toestemming voor niet-essentiële cookies</p>
                  </div>
                  <Switch id="cookie-consent" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Integraties Instellingen */}
        <TabsContent value="integraties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Integraties</CardTitle>
              <CardDescription>Beheer externe API-integraties en -services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      <Database className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">SIS Integratie</p>
                      <p className="text-sm text-gray-500">Student Informatie Systeem API</p>
                    </div>
                  </div>
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Verbonden</Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mailchimp</p>
                      <p className="text-sm text-gray-500">Email marketing en nieuwsbrieven</p>
                    </div>
                  </div>
                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">Niet verbonden</Badge>
                </div>

                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      <Globe className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Learning Management Systeem</p>
                      <p className="text-sm text-gray-500">Canvas LMS Integratie</p>
                    </div>
                  </div>
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Verbonden</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Nieuwe Integratie</Button>
              <Button>API Sleutels Beheren</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Single Sign-On (SSO)</CardTitle>
              <CardDescription>Configureer Single Sign-On providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="google-sso">Google SSO</Label>
                    <p className="text-sm text-gray-500">Inloggen met Google-account</p>
                  </div>
                  <Switch id="google-sso" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="microsoft-sso">Microsoft SSO</Label>
                    <p className="text-sm text-gray-500">Inloggen met Microsoft-account</p>
                  </div>
                  <Switch id="microsoft-sso" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="saml-sso">SAML SSO</Label>
                    <p className="text-sm text-gray-500">Aangepaste SAML-integratie</p>
                  </div>
                  <Switch id="saml-sso" />
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">SSO Instellingen Configureren</Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Wijzigingen Opslaan</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}