import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminStatsGrid,
  AdminStatCard,
  AdminActionButton,
  AdminSearchBar,
  AdminTableCard,
  AdminFilterSelect,
  AdminAvatar
} from "@/components/ui/admin-layout";
import {
  MessageSquare,
  Send,
  Mail,
  Phone,
  Users,
  TrendingUp,
  Download,
  Upload,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

// Define RESOURCES locally
const RESOURCES = {
  COMMUNICATIONS: 'communications',
  STUDENTS: 'students'
} as const;

interface Communication {
  id: number;
  title: string;
  message: string;
  type: 'email' | 'sms' | 'notification' | 'announcement';
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  recipientType: 'students' | 'guardians' | 'teachers' | 'all';
  recipientCount: number;
  sentDate?: string;
  scheduledDate?: string;
  createdBy: string;
  priority: 'low' | 'medium' | 'high';
}

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
}

const communicationFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  message: z.string().min(1, "Bericht is verplicht"),
  type: z.enum(['email', 'sms', 'notification', 'announcement']),
  recipientType: z.enum(['students', 'guardians', 'teachers', 'all']),
  priority: z.enum(['low', 'medium', 'high']),
  scheduledDate: z.string().optional(),
});

type CommunicationFormData = z.infer<typeof communicationFormSchema>;

export default function Communications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = useRBAC();

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "email",
      recipientType: "students",
      priority: "medium",
      scheduledDate: "",
    },
  });

  const { data: communications = [], isLoading: communicationsLoading } = useQuery<Communication[]>({
    queryKey: ["/api/communications"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const createCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const response = await apiRequest("POST", "/api/communications", { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communicatie succesvol toegevoegd" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen communicatie",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const response = await apiRequest("PUT", `/api/communications/${selectedCommunication?.id}`, { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communicatie succesvol bijgewerkt" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken communicatie",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommunicationMutation = useMutation({
    mutationFn: async (communicationId: number) => {
      await apiRequest("DELETE", `/api/communications/${communicationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communicatie succesvol verwijderd" });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen communicatie",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCommunications = communications.filter((comm: Communication) => {
    const matchesSearch = 
      comm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || comm.type === typeFilter;
    const matchesStatus = statusFilter === "all" || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateCommunication = () => {
    setDialogMode('create');
    setSelectedCommunication(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewCommunication = (communication: Communication) => {
    setDialogMode('view');
    setSelectedCommunication(communication);
    setShowDialog(true);
  };

  const handleEditCommunication = (communication: Communication) => {
    setDialogMode('edit');
    setSelectedCommunication(communication);
    form.reset({
      title: communication.title,
      message: communication.message,
      type: communication.type,
      recipientType: communication.recipientType,
      priority: communication.priority,
      scheduledDate: communication.scheduledDate || "",
    });
    setShowDialog(true);
  };

  const handleDeleteCommunication = (communication: Communication) => {
    if (window.confirm(`Weet je zeker dat je communicatie "${communication.title}" wilt verwijderen?`)) {
      deleteCommunicationMutation.mutate(communication.id);
    }
  };

  const onSubmit = (data: CommunicationFormData) => {
    if (dialogMode === 'create') {
      createCommunicationMutation.mutate(data);
    } else if (dialogMode === 'edit') {
      updateCommunicationMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { className: "bg-gray-100 text-gray-800", icon: <Edit className="w-3 h-3 mr-1" /> },
      sent: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      scheduled: { className: "bg-blue-100 text-blue-800", icon: <Clock className="w-3 h-3 mr-1" /> },
      failed: { className: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3 mr-1" /> }
    };
    
    const labels = {
      draft: "Concept",
      sent: "Verstuurd",
      scheduled: "Gepland",
      failed: "Mislukt"
    };
    
    const variant = variants[status as keyof typeof variants];
    
    return (
      <Badge className={variant.className}>
        <div className="flex items-center">
          {variant.icon}
          {labels[status as keyof typeof labels]}
        </div>
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      email: { className: "bg-blue-100 text-blue-800", icon: <Mail className="w-3 h-3 mr-1" /> },
      sms: { className: "bg-green-100 text-green-800", icon: <Phone className="w-3 h-3 mr-1" /> },
      notification: { className: "bg-yellow-100 text-yellow-800", icon: <MessageSquare className="w-3 h-3 mr-1" /> },
      announcement: { className: "bg-purple-100 text-purple-800", icon: <TrendingUp className="w-3 h-3 mr-1" /> }
    };
    
    const labels = {
      email: "Email",
      sms: "SMS",
      notification: "Notificatie",
      announcement: "Aankondiging"
    };
    
    const variant = variants[type as keyof typeof variants];
    
    return (
      <Badge className={variant.className}>
        <div className="flex items-center">
          {variant.icon}
          {labels[type as keyof typeof labels]}
        </div>
      </Badge>
    );
  };

  const totalCommunications = communications.length;
  const sentCommunications = communications.filter(c => c.status === 'sent').length;
  const scheduledCommunications = communications.filter(c => c.status === 'scheduled').length;
  const totalRecipients = communications.reduce((sum, comm) => sum + comm.recipientCount, 0);

  if (communicationsLoading || studentsLoading) {
    return (
      <AdminPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader 
        title="Communicatie" 
        description="Beheer communicatie met studenten, voogden en docenten"
      >
        <AdminActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporteren
        </AdminActionButton>
        <AdminActionButton variant="outline" icon={<Upload className="w-4 h-4" />}>
          Sjablonen
        </AdminActionButton>
        {canCreate(RESOURCES.COMMUNICATIONS) && (
          <AdminActionButton 
            icon={<Send className="w-4 h-4" />}
            onClick={handleCreateCommunication}
          >
            Nieuwe Communicatie
          </AdminActionButton>
        )}
      </AdminPageHeader>

      <AdminStatsGrid columns={4}>
        <AdminStatCard
          title="Totaal Berichten"
          value={totalCommunications}
          subtitle="Alle communicaties"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Verstuurd"
          value={sentCommunications}
          subtitle="Verzonden berichten"
          valueColor="text-green-600"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Gepland"
          value={scheduledCommunications}
          subtitle="Ingeplande berichten"
          valueColor="text-blue-600"
          icon={<Clock className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Ontvangers"
          value={totalRecipients}
          subtitle="Totaal bereikt"
          valueColor="text-blue-600"
          icon={<Users className="h-4 w-4" />}
        />
      </AdminStatsGrid>

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoek op titel, bericht of auteur..."
        filters={
          <>
            <AdminFilterSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="Type filter"
              options={[
                { value: "all", label: "Alle types" },
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "notification", label: "Notificatie" },
                { value: "announcement", label: "Aankondiging" }
              ]}
            />
            <AdminFilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Status filter"
              options={[
                { value: "all", label: "Alle statussen" },
                { value: "draft", label: "Concept" },
                { value: "sent", label: "Verstuurd" },
                { value: "scheduled", label: "Gepland" },
                { value: "failed", label: "Mislukt" }
              ]}
            />
          </>
        }
      />

      <AdminTableCard 
        title={`Communicaties (${filteredCommunications.length})`}
        subtitle="Beheer alle communicaties"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ontvangers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommunications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Geen communicaties gevonden
                </TableCell>
              </TableRow>
            ) : (
              filteredCommunications.map((communication: Communication) => (
                <TableRow key={communication.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{communication.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {communication.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(communication.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-blue-600">{communication.recipientCount}</span>
                      <span className="text-sm text-gray-500 ml-1">{communication.recipientType}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(communication.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {communication.sentDate ? 
                        new Date(communication.sentDate).toLocaleDateString('nl-NL') :
                        communication.scheduledDate ?
                        new Date(communication.scheduledDate).toLocaleDateString('nl-NL') :
                        'Niet gepland'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCommunication(communication)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdate(RESOURCES.COMMUNICATIONS) && communication.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCommunication(communication)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete(RESOURCES.COMMUNICATIONS) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCommunication(communication)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableCard>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuwe Communicatie Aanmaken'}
              {dialogMode === 'edit' && 'Communicatie Bewerken'}
              {dialogMode === 'view' && 'Communicatie Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedCommunication ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Titel</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommunication.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedCommunication.type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCommunication.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ontvangers</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommunication.recipientCount} {selectedCommunication.recipientType}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Bericht</Label>
                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedCommunication.message}</p>
                </div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="notification">Notificatie</SelectItem>
                            <SelectItem value="announcement">Aankondiging</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ontvangers</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer ontvangers" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="students">Studenten</SelectItem>
                            <SelectItem value="guardians">Voogden</SelectItem>
                            <SelectItem value="teachers">Docenten</SelectItem>
                            <SelectItem value="all">Iedereen</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioriteit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer prioriteit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Laag</SelectItem>
                            <SelectItem value="medium">Gemiddeld</SelectItem>
                            <SelectItem value="high">Hoog</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bericht</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCommunicationMutation.isPending || updateCommunicationMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {dialogMode === 'create' ? 'Communicatie Aanmaken' : 'Wijzigingen Opslaan'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}