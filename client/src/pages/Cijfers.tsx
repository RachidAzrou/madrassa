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
import { PremiumHeader } from '@/components/layout/premium-header';

export default function Cijfers() {
  // State
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Data fetching
  const { data: classesData } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: subjectsData } = useQuery({ queryKey: ['/api/programs'] });
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students/class', selectedClass?.id],
    enabled: !!selectedClass?.id
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    type: 'test',
    points: '',
    weight: ''
  });

  // Mock data voor beoordelingen per vak
  const mockAssessments = {
    'Koran': [
      { id: 1, name: 'Test 1', type: 'test', points: 85, weight: 25, date: '2024-01-15' },
      { id: 2, name: 'Huiswerk 1', type: 'taak', points: 92, weight: 15, date: '2024-01-22' },
      { id: 3, name: 'Examen', type: 'examen', points: 78, weight: 60, date: '2024-02-01' }
    ],
    'Arabisch 1': [
      { id: 4, name: 'Vocabulaire Test', type: 'test', points: 88, weight: 30, date: '2024-01-18' },
      { id: 5, name: 'Presentatie', type: 'presentatie', points: 91, weight: 40, date: '2024-01-25' },
      { id: 6, name: 'Eindopdracht', type: 'project', points: 87, weight: 30, date: '2024-02-05' }
    ]
  };

  const filteredStudents = studentsData || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Cijfers & Beoordelingen" 
        path="Evaluatie > Cijfers" 
        icon={Calculator}
        description="Beheer cijfers en gedragsbeoordelingen voor studenten per klas en vak"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-5">
            {/* Tab selector en filters */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 space-y-4">
                <Tabs
                  value={selectedClass ? 'beoordelingen' : 'selecteer'}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="selecteer" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Klas selecteren
                    </TabsTrigger>
                    <TabsTrigger 
                      value="beoordelingen" 
                      disabled={!selectedClass}
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Beoordelingen
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="selecteer" className="mt-4">
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Selecteer een klas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classesData?.map(classGroup => (
                            <div
                              key={classGroup.id}
                              onClick={() => setSelectedClass(classGroup)}
                              className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <h4 className="font-medium">{classGroup.name}</h4>
                              <p className="text-sm text-gray-600">{classGroup.academicYear}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="beoordelingen" className="mt-4">
                    {selectedClass && (
                      <div className="space-y-4">
                        {/* Vak selectie */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-green-600" />
                            Selecteer een vak voor {selectedClass.name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjectsData?.programs?.map(subject => (
                              <div
                                key={subject.id}
                                onClick={() => setSelectedSubject(subject)}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedSubject?.id === subject.id 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'hover:border-green-500 hover:bg-green-50'
                                }`}
                              >
                                <h4 className="font-medium">{subject.name}</h4>
                                <p className="text-sm text-gray-600">{subject.code}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Beoordelingen tabel */}
                        {selectedSubject && (
                          <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-purple-600" />
                                    Beoordelingen voor {selectedSubject.name}
                                  </h3>
                                  <p className="text-gray-600">Klas: {selectedClass.name}</p>
                                </div>
                                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Nieuwe beoordeling
                                </Button>
                              </div>
                            </div>

                            <div className="p-6">
                              {/* Zoekbalk */}
                              <div className="mb-4">
                                <div className="relative">
                                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                  <Input
                                    placeholder="Zoek beoordelingen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              {/* Beoordelingen tabel */}
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Beoordeling</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Datum</TableHead>
                                      <TableHead>Gewicht (%)</TableHead>
                                      <TableHead>Gemiddelde</TableHead>
                                      <TableHead>Acties</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {mockAssessments[selectedSubject.name]?.length > 0 ? (
                                      mockAssessments[selectedSubject.name].map(assessment => (
                                        <TableRow key={assessment.id}>
                                          <TableCell className="font-medium">{assessment.name}</TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                              {assessment.type === 'test' && <FileText className="h-3 w-3" />}
                                              {assessment.type === 'taak' && <ClipboardList className="h-3 w-3" />}
                                              {assessment.type === 'examen' && <Award className="h-3 w-3" />}
                                              {assessment.type === 'presentatie' && <User className="h-3 w-3" />}
                                              {assessment.type === 'project' && <Star className="h-3 w-3" />}
                                              {assessment.type}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{assessment.date}</TableCell>
                                          <TableCell>{assessment.weight}%</TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Badge 
                                                variant={assessment.points >= 80 ? "default" : assessment.points >= 60 ? "secondary" : "destructive"}
                                                className="text-sm"
                                              >
                                                {assessment.points}
                                              </Badge>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingAssessment(assessment)}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                          Geen beoordelingen gevonden voor dit vak
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Actie knoppen */}
              <div className="space-y-2 lg:w-64">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exporteer cijfers
                </Button>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Opslaan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Assessment Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="bg-[#1e40af] text-white px-6 py-4 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-white">
                  📝 Nieuwe beoordeling toevoegen
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Voeg een nieuwe beoordeling toe voor {selectedSubject?.name}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basis informatie sectie */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                📋 Basisinformatie
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naam beoordeling *</Label>
                  <Input
                    id="name"
                    value={assessmentForm.name}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="bijv. Test 1, Huiswerk opdracht"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type beoordeling *</Label>
                  <Select
                    value={assessmentForm.type}
                    onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">📝 Test</SelectItem>
                      <SelectItem value="taak">📚 Taak/Huiswerk</SelectItem>
                      <SelectItem value="examen">🎓 Examen</SelectItem>
                      <SelectItem value="presentatie">🎤 Presentatie</SelectItem>
                      <SelectItem value="project">🌟 Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Waardering sectie */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                📊 Waardering & Gewicht
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Maximum punten *</Label>
                  <Input
                    id="points"
                    type="number"
                    value={assessmentForm.points}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, points: e.target.value }))}
                    placeholder="bijv. 100"
                  />
                  <p className="text-xs text-gray-600">
                    💡 Tip: Gebruik standaard 100 punten voor eenvoudige berekeningen
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Gewicht (%) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={assessmentForm.weight}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="bijv. 25"
                  />
                  <p className="text-xs text-gray-600">
                    ⚖️ Het relatieve gewicht voor de eindcijfer berekening
                  </p>
                </div>
              </div>
            </div>

            {/* Help sectie */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
                💡 Handige tips
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Zorg dat alle gewichten samen 100% vormen</li>
                <li>• Examens hebben meestal een hoger gewicht (50-60%)</li>
                <li>• Tests en taken krijgen meestal 15-30% gewicht</li>
                <li>• Gebruik duidelijke namen zoals "Test 1" of "Eindexamen"</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Annuleren
            </Button>
            <Button onClick={() => setShowAddModal(false)} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
              <Plus className="h-4 w-4 mr-2" />
              Beoordeling toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}