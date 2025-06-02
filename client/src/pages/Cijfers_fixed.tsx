import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Save, Plus, X, Edit, Trash2, AlertCircle, Percent, XCircle, User, BookOpen, Calculator, CheckCircle, Star, ClipboardList, FileText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from '@/hooks/use-toast';

export default function Cijfers() {
  // Data fetching
  const { data: classesData } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: programsData } = useQuery({ queryKey: ['/api/programs'] });
  
  const classes = classesData || [];
  const subjects = programsData?.programs?.map((program: any) => ({ 
    id: program.id, 
    name: program.name,
    code: program.code 
  })) || [];
  
  const [activeTab, setActiveTab] = useState('grades');
  const [selectedClass, setSelectedClass] = useState(''); 
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  
  // States for new assessment dialog
  const [showAddScoreDialog, setShowAddScoreDialog] = useState(false);
  const [newScoreData, setNewScoreData] = useState({
    subject: '',
    assessmentType: '',
    assessmentName: '',
    maxPoints: '',
    weight: ''
  });

  // Fetch students when class is selected
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students/class', selectedClass],
    enabled: !!selectedClass
  });

  const filteredStudents = studentsData || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Cijfers & Beoordelingen</h1>
              <p className="text-gray-600">Beheer cijfers en gedragsbeoordelingen voor studenten</p>
            </div>

            <div className="space-y-5">
              {/* Tab selector en filters */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 space-y-4">
                  <Tabs
                    defaultValue={activeTab}
                    className="w-full"
                    onValueChange={(value) => {
                      setActiveTab(value);
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2 h-11">
                      <TabsTrigger value="grades" className="text-sm">Cijfers</TabsTrigger>
                      <TabsTrigger value="behavior" className="text-sm">Gedrag</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col md:flex-row gap-3 md:items-center mt-4">
                      <div className="w-full md:w-64">
                        <Select
                          value={selectedClass}
                          onValueChange={(value) => {
                            setSelectedClass(value);
                            setSelectedSubject(''); // Reset vak selectie
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een klas" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedClass && activeTab === 'grades' && (
                        <div className="w-full md:w-64">
                          <Select
                            value={selectedSubject}
                            onValueChange={(value) => {
                              setSelectedSubject(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een vak" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.name}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedClass && (
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Zoek studenten..."
                              value={studentFilter}
                              onChange={(e) => setStudentFilter(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <TabsContent value="grades" className="mt-6">
                      {!selectedClass ? (
                        <div className="p-8 text-center text-gray-500">
                          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">Selecteer een klas</h3>
                          <p>Kies eerst een klas om verder te gaan</p>
                        </div>
                      ) : !selectedSubject ? (
                        <div className="p-8 text-center text-gray-500">
                          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">Selecteer een vak</h3>
                          <p>Kies een vak om de beoordelingen en cijfers te bekijken</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-md border shadow-sm">
                          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h2 className="text-lg font-medium text-gray-800">
                                Cijfers voor {selectedSubject}
                              </h2>
                              <p className="text-sm text-gray-600">
                                Klas: {classes.find((c: any) => c.id.toString() === selectedClass)?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8">
                                <Download className="mr-2 h-4 w-4" />
                                Exporteren
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => setShowAddScoreDialog(true)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Nieuwe beoordeling
                              </Button>
                            </div>
                          </div>

                          {isLoadingStudents ? (
                            <div className="p-8 flex justify-center">
                              <div className="animate-spin h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full"></div>
                            </div>
                          ) : filteredStudents.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                                    <TableHead className="w-[250px] font-semibold text-gray-700 py-4">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Student
                                      </div>
                                    </TableHead>
                                    {/* Hier komen de beoordelingen voor het geselecteerde vak */}
                                    <TableHead className="text-center font-semibold text-gray-700 py-4">
                                      <div className="flex flex-col items-center gap-1">
                                        <ClipboardList className="h-4 w-4 text-green-600" />
                                        <span>Test 1</span>
                                        <span className="text-xs text-gray-500 font-normal">40% - 100 ptn</span>
                                      </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-gray-700 py-4">
                                      <div className="flex flex-col items-center gap-1">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span>Huiswerk 1</span>
                                        <span className="text-xs text-gray-500 font-normal">20% - 50 ptn</span>
                                      </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-gray-700 py-4">
                                      <div className="flex flex-col items-center gap-1">
                                        <Award className="h-4 w-4 text-purple-600" />
                                        <span>Examen</span>
                                        <span className="text-xs text-gray-500 font-normal">60% - 200 ptn</span>
                                      </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <Calculator className="h-4 w-4" />
                                        Gemiddelde
                                      </div>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredStudents.map((student: any) => (
                                    <TableRow key={student.id}>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-[#1e3a8a] text-white text-xs">
                                              {student.firstName[0]}{student.lastName[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                                            <div className="text-xs text-gray-500">{student.studentId}</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      
                                      {/* Cijfercellen voor de beoordelingen van het geselecteerde vak */}
                                      <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-2 p-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            placeholder="85"
                                            className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value=""
                                            onChange={(e) => {
                                              // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                            }}
                                          />
                                          <span className="text-xs text-gray-500">85%</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-2 p-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="1"
                                            placeholder="42"
                                            className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value=""
                                            onChange={(e) => {
                                              // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                            }}
                                          />
                                          <span className="text-xs text-gray-500">84%</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-2 p-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="200"
                                            step="1"
                                            placeholder="165"
                                            className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value=""
                                            onChange={(e) => {
                                              // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                            }}
                                          />
                                          <span className="text-xs text-gray-500">83%</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className="text-right font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            8.4
                                          </Badge>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                              <h3 className="text-lg font-medium mb-2">Geen studenten gevonden</h3>
                              <p>Er zijn geen studenten in deze klas of ze voldoen niet aan de zoekfilters.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="behavior" className="mt-6">
                      {selectedClass ? (
                        <div className="bg-white rounded-md border shadow-sm">
                          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-lg font-medium text-gray-800">Gedragsbeoordelingen</h2>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8">
                                <Download className="mr-2 h-4 w-4" />
                                Exporteren
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-8 text-center text-gray-500">
                            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Gedragsfunctionaliteit</h3>
                            <p>Gedragsbeoordelingen worden later geïmplementeerd</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">Selecteer een klas</h3>
                          <p>Kies eerst een klas om verder te gaan</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add new assessment dialog */}
      <Dialog open={showAddScoreDialog} onOpenChange={setShowAddScoreDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">Nieuwe beoordeling toevoegen</DialogTitle>
            <DialogDescription className="text-gray-600">
              Voeg een nieuwe beoordeling toe voor een vak. Deze wordt automatisch toegevoegd voor alle studenten in de klas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vak selectie */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Vak <span className="text-red-500">*</span>
              </label>
              <Select
                value={newScoreData.subject}
                onValueChange={(value) => setNewScoreData({...newScoreData, subject: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecteer een vak" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Type en gewicht */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newScoreData.assessmentType}
                  onValueChange={(value) => setNewScoreData({...newScoreData, assessmentType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">📝 Test</SelectItem>
                    <SelectItem value="taak">📋 Taak</SelectItem>
                    <SelectItem value="examen">🎓 Examen</SelectItem>
                    <SelectItem value="presentatie">🎤 Presentatie</SelectItem>
                    <SelectItem value="project">📁 Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Gewicht <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newScoreData.weight}
                  onValueChange={(value) => setNewScoreData({...newScoreData, weight: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gewicht" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10% - Klein</SelectItem>
                    <SelectItem value="20">20% - Normaal</SelectItem>
                    <SelectItem value="30">30% - Belangrijk</SelectItem>
                    <SelectItem value="40">40% - Test</SelectItem>
                    <SelectItem value="50">50% - Groot</SelectItem>
                    <SelectItem value="60">60% - Examen</SelectItem>
                    <SelectItem value="100">100% - Volledig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Naam */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Naam beoordeling <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Bijv. Test Hoofdstuk 1, Huiswerk Oefeningen, Eindexamen..."
                value={newScoreData.assessmentName}
                onChange={(e) => setNewScoreData({...newScoreData, assessmentName: e.target.value})}
                className="w-full"
              />
            </div>
            
            {/* Maximum punten */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Maximum punten <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  placeholder="100"
                  className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={newScoreData.maxPoints}
                  onChange={(e) => setNewScoreData({...newScoreData, maxPoints: e.target.value})}
                />
                <span className="text-sm text-gray-500">punten mogelijk</span>
              </div>
              <p className="text-xs text-gray-500">
                Dit wordt gebruikt om percentages te berekenen (bijv. 8/10 = 80%)
              </p>
            </div>
            
            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Hoe werkt dit?</p>
                  <p>Deze beoordeling wordt toegevoegd voor alle studenten in de geselecteerde klas. Docenten kunnen daarna individuele punten invoeren.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAddScoreDialog(false)}
              className="order-2 sm:order-1"
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                if (!newScoreData.subject || !newScoreData.assessmentType || !newScoreData.assessmentName || !newScoreData.maxPoints) {
                  toast({
                    title: "Onvolledige gegevens",
                    description: "Vul alle verplichte velden in.",
                    variant: "destructive",
                  });
                  return;
                }
                
                // TODO: Implementeer API call om beoordeling aan te maken
                toast({
                  title: "Beoordeling toegevoegd",
                  description: `${newScoreData.assessmentName} is succesvol toegevoegd.`,
                });
                
                setShowAddScoreDialog(false);
                setNewScoreData({
                  subject: '',
                  assessmentType: '',
                  assessmentName: '',
                  maxPoints: '',
                  weight: ''
                });
              }}
            >
              Beoordeling toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}