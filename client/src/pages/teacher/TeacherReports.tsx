import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  FileText, BarChart3, PieChart, TrendingUp, Calendar,
  Users, GraduationCap, BookOpen, Clock, Target,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types - exact copy from admin
interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  lastGenerated?: string;
  status: string;
  parameters?: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'student' | 'class' | 'attendance' | 'grades' | 'academic';
  icon: any;
  parameters: string[];
}

// Admin-style components
const DataTableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden">
    {children}
  </div>
);

const SearchActionBar = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
    {children}
  </div>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    {children}
  </div>
);

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function TeacherReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedReports, setSelectedReports] = useState<number[]>([]);

  // Mock data for teacher reports
  const reports: Report[] = [
    {
      id: 1,
      name: "Aanwezigheidsrapport Klas 1A",
      type: "attendance",
      description: "Maandelijks aanwezigheidsoverzicht voor klas 1A",
      createdAt: "2025-06-01",
      lastGenerated: "2025-06-08",
      status: "completed"
    },
    {
      id: 2,
      name: "Cijferoverzicht Arabisch",
      type: "grades",
      description: "Overzicht van alle cijfers voor het vak Arabisch",
      createdAt: "2025-05-28",
      lastGenerated: "2025-06-07",
      status: "completed"
    },
    {
      id: 3,
      name: "Voortgangsrapport Studenten",
      type: "student",
      description: "Individuele voortgangsrapporten per student",
      createdAt: "2025-06-05",
      status: "pending"
    }
  ];

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'attendance',
      name: 'Aanwezigheidsrapport',
      description: 'Genereer aanwezigheidsrapporten voor uw klassen',
      type: 'attendance',
      icon: UserPlus,
      parameters: ['klas', 'periode', 'studenten']
    },
    {
      id: 'grades',
      name: 'Cijferrapport',
      description: 'Overzicht van cijfers en beoordelingen',
      type: 'grades',
      icon: BarChart3,
      parameters: ['vak', 'periode', 'klassen']
    },
    {
      id: 'progress',
      name: 'Voortgangsrapport',
      description: 'Academische voortgang van studenten',
      type: 'student',
      icon: TrendingUp,
      parameters: ['studenten', 'vakken', 'periode']
    },
    {
      id: 'class-overview',
      name: 'Klasoverzicht',
      description: 'Algemeen overzicht van klasactiviteiten',
      type: 'class',
      icon: Users,
      parameters: ['klas', 'academisch-jaar']
    }
  ];

  // Filter reports based on search term, type, and status
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || report.type === typeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setDialogMode('view');
    setShowDialog(true);
  };

  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setDialogMode('edit');
    setShowDialog(true);
  };

  const handleCreateReport = () => {
    setSelectedReport(null);
    setDialogMode('create');
    setShowDialog(true);
  };

  const handleDeleteReport = (report: Report) => {
    if (confirm(`Weet je zeker dat je rapport "${report.name}" wilt verwijderen?`)) {
      toast({
        title: "Rapport verwijderd",
        description: `Rapport "${report.name}" is succesvol verwijderd.`,
      });
    }
  };

  const handleGenerateReport = (templateId: string) => {
    toast({
      title: "Rapport wordt gegenereerd",
      description: "Uw rapport wordt op de achtergrond gegenereerd en zal binnenkort beschikbaar zijn.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Voltooid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In behandeling</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Mislukt</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'grades':
        return <BarChart3 className="h-4 w-4 text-green-600" />;
      case 'student':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'class':
        return <GraduationCap className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header - Exact admin styling */}
      <PremiumHeader
        title="Rapporten"
        description="Genereer en beheer rapporten voor uw klassen"
        icon={FileText}
        breadcrumbs={{
          parent: "Docent",
          current: "Rapporten"
        }}
      />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {template.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleGenerateReport(template.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Genereren
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reports Table */}
        <DataTableContainer>
          <SearchActionBar>
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek rapporten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="attendance">Aanwezigheid</SelectItem>
                  <SelectItem value="grades">Cijfers</SelectItem>
                  <SelectItem value="student">Studenten</SelectItem>
                  <SelectItem value="class">Klassen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                  <SelectItem value="failed">Mislukt</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button size="sm" onClick={handleCreateReport}>
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Rapport
              </Button>
            </div>
          </SearchActionBar>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedReports(checked ? filteredReports.map(r => r.id) : []);
                      }}
                    />
                  </TableHead>
                  <TableHead>Rapport</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Laatst Gegenereerd</TableHead>
                  <TableHead className="w-20">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <EmptyState
                        icon={<FileText className="w-12 h-12" />}
                        title="Geen rapporten gevonden"
                        description="Er zijn geen rapporten die voldoen aan uw zoekcriteria."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow 
                      key={report.id}
                      className={selectedReports.includes(report.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.includes(report.id)}
                          onCheckedChange={(checked) => {
                            setSelectedReports(prev => 
                              checked 
                                ? [...prev, report.id]
                                : prev.filter(id => id !== report.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getTypeIcon(report.type)}
                          </div>
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-muted-foreground">{report.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.lastGenerated || '-'}
                      </TableCell>
                      <TableCell>
                        <QuickActions
                          onView={() => handleViewReport(report)}
                          onEdit={() => handleEditReport(report)}
                          onDelete={() => handleDeleteReport(report)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataTableContainer>
      </div>
    </div>
  );
}