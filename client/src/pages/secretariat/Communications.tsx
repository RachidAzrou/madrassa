import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Calendar,
  User,
  Users,
  Mail,
  Phone,
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Trash2
} from "lucide-react";

const RESOURCES = {
  COMMUNICATIONS: 'communications',
  STUDENTS: 'students',
  GUARDIANS: 'guardians'
} as const;

interface Message {
  id: number;
  subject: string;
  content: string;
  recipientType: 'student' | 'guardian' | 'teacher' | 'all_students' | 'all_guardians' | 'all_teachers';
  recipientId?: number;
  recipientName?: string;
  recipientEmail?: string;
  senderName: string;
  sentAt: string;
  readAt?: string;
  status: 'draft' | 'sent' | 'delivered' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  messageType: 'announcement' | 'reminder' | 'notification' | 'emergency' | 'personal';
  attachments?: string[];
}

interface MessageStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  readRate: number;
  averageReadTime: number;
}

const messageFormSchema = z.object({
  subject: z.string().min(1, "Onderwerp is verplicht"),
  content: z.string().min(1, "Bericht is verplicht"),
  recipientType: z.enum(['student', 'guardian', 'teacher', 'all_students', 'all_guardians', 'all_teachers']),
  recipientId: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  messageType: z.enum(['announcement', 'reminder', 'notification', 'emergency', 'personal']),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

export default function Communications() {
  const { canCreate, canUpdate, canRead } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');

  if (!canRead(RESOURCES.COMMUNICATIONS)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Je hebt geen toegang tot deze pagina.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: messagesData, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/communications'],
    retry: false,
  });

  const { data: statsData } = useQuery<{ stats: MessageStats }>({
    queryKey: ['/api/communications/stats'],
    retry: false,
  });

  const { data: studentsData } = useQuery<{ students: Array<{id: number, firstName: string, lastName: string, email: string}> }>({
    queryKey: ['/api/students/basic'],
    retry: false,
  });

  const { data: guardiansData } = useQuery<{ guardians: Array<{id: number, firstName: string, lastName: string, email: string}> }>({
    queryKey: ['/api/guardians/basic'],
    retry: false,
  });

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      subject: "",
      content: "",
      recipientType: 'student',
      recipientId: undefined,
      priority: 'normal',
      messageType: 'announcement',
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      return apiRequest('POST', '/api/communications/send', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications/stats'] });
      toast({ title: "Bericht verzonden", description: "Het bericht is succesvol verzonden." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het verzenden van het bericht.",
        variant: "destructive",
      });
    },
  });

  const messages = messagesData?.messages || [];
  const stats = statsData?.stats || {
    totalSent: 0,
    totalRead: 0,
    totalUnread: 0,
    readRate: 0,
    averageReadTime: 0
  };
  const students = studentsData?.students || [];
  const guardians = guardiansData?.guardians || [];

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = searchTerm === "" || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesType = typeFilter === "all" || message.messageType === typeFilter;
    const matchesRecipient = recipientFilter === "all" || message.recipientType === recipientFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesRecipient;
  });

  const handleCreateMessage = () => {
    setDialogMode('create');
    setSelectedMessage(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewMessage = (message: Message) => {
    setDialogMode('view');
    setSelectedMessage(message);
    setShowDialog(true);
  };

  const onSubmit = (data: MessageFormData) => {
    if (dialogMode === 'create') {
      sendMessageMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Edit className="w-3 h-3 mr-1" />Concept</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" />Verzonden</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Afgeleverd</Badge>;
      case 'read':
        return <Badge variant="secondary" className="bg-violet-100 text-violet-800"><Eye className="w-3 h-3 mr-1" />Gelezen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Hoog</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Normaal</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Laag</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'announcement': { label: 'Aankondiging', color: 'bg-blue-100 text-blue-800' },
      'reminder': { label: 'Herinnering', color: 'bg-yellow-100 text-yellow-800' },
      'notification': { label: 'Notificatie', color: 'bg-green-100 text-green-800' },
      'emergency': { label: 'Noodgeval', color: 'bg-red-100 text-red-800' },
      'personal': { label: 'Persoonlijk', color: 'bg-purple-100 text-purple-800' }
    };
    
    const messageType = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant="secondary" className={messageType.color}>{messageType.label}</Badge>;
  };

  const getRecipientDisplay = (message: Message) => {
    switch (message.recipientType) {
      case 'all_students':
        return 'Alle Studenten';
      case 'all_guardians':
        return 'Alle Voogden';
      case 'all_teachers':
        return 'Alle Docenten';
      default:
        return message.recipientName || 'Onbekend';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communicatie</h1>
          <p className="text-gray-600 mt-2">
            Beheer berichten en communicatie met studenten, voogden en docenten
          </p>
        </div>
        {canCreate(RESOURCES.COMMUNICATIONS) && (
          <Button onClick={handleCreateMessage} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Bericht
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totaal Verzonden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-gray-500">Berichten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gelezen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalRead}</div>
            <p className="text-xs text-gray-500">Berichten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ongelezen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalUnread}</div>
            <p className="text-xs text-gray-500">Berichten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Leespercentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.readRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Gelezen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gem. Leestijd</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageReadTime}</div>
            <p className="text-xs text-gray-500">Uren</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Zoek op onderwerp, inhoud of ontvanger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                  <SelectItem value="sent">Verzonden</SelectItem>
                  <SelectItem value="delivered">Afgeleverd</SelectItem>
                  <SelectItem value="read">Gelezen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="announcement">Aankondiging</SelectItem>
                  <SelectItem value="reminder">Herinnering</SelectItem>
                  <SelectItem value="notification">Notificatie</SelectItem>
                  <SelectItem value="emergency">Noodgeval</SelectItem>
                  <SelectItem value="personal">Persoonlijk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ontvanger filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle ontvangers</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="teacher">Docent</SelectItem>
                  <SelectItem value="all_students">Alle Studenten</SelectItem>
                  <SelectItem value="all_guardians">Alle Voogden</SelectItem>
                  <SelectItem value="all_teachers">Alle Docenten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Berichten ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Ontvanger</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead>Verzonden</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Geen berichten gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.subject}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {message.content.substring(0, 80)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {message.recipientType.startsWith('all_') ? (
                            <Users className="w-4 h-4 text-gray-400" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                          <span>{getRecipientDisplay(message)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(message.messageType)}</TableCell>
                      <TableCell>{getPriorityBadge(message.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{new Date(message.sentAt).toLocaleDateString('nl-NL')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMessage(message)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuw Bericht Verzenden'}
              {dialogMode === 'view' && 'Bericht Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedMessage ? (
            <div className="space-y-6">
              {/* Message Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Van:</span>
                        <span>{selectedMessage.senderName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Naar:</span>
                        <span>{getRecipientDisplay(selectedMessage)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {getTypeBadge(selectedMessage.messageType)}
                      {getPriorityBadge(selectedMessage.priority)}
                      {getStatusBadge(selectedMessage.status)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Verzonden: {new Date(selectedMessage.sentAt).toLocaleString('nl-NL')}</span>
                    </div>
                    {selectedMessage.readAt && (
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Gelezen: {new Date(selectedMessage.readAt).toLocaleString('nl-NL')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bericht Inhoud</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bijlagen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onderwerp</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="messageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type Bericht</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="announcement">Aankondiging</SelectItem>
                            <SelectItem value="reminder">Herinnering</SelectItem>
                            <SelectItem value="notification">Notificatie</SelectItem>
                            <SelectItem value="emergency">Noodgeval</SelectItem>
                            <SelectItem value="personal">Persoonlijk</SelectItem>
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
                        <FormLabel>Ontvanger Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer ontvanger type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Specifieke Student</SelectItem>
                            <SelectItem value="guardian">Specifieke Voogd</SelectItem>
                            <SelectItem value="teacher">Specifieke Docent</SelectItem>
                            <SelectItem value="all_students">Alle Studenten</SelectItem>
                            <SelectItem value="all_guardians">Alle Voogden</SelectItem>
                            <SelectItem value="all_teachers">Alle Docenten</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer prioriteit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Laag</SelectItem>
                            <SelectItem value="normal">Normaal</SelectItem>
                            <SelectItem value="high">Hoog</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(form.watch('recipientType') === 'student' || 
                  form.watch('recipientType') === 'guardian' || 
                  form.watch('recipientType') === 'teacher') && (
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specifieke Ontvanger</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer ontvanger" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch('recipientType') === 'student' && students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName} ({student.email})
                              </SelectItem>
                            ))}
                            {form.watch('recipientType') === 'guardian' && guardians.map((guardian) => (
                              <SelectItem key={guardian.id} value={guardian.id.toString()}>
                                {guardian.firstName} {guardian.lastName} ({guardian.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bericht Inhoud</FormLabel>
                      <FormControl>
                        <textarea 
                          {...field}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={8}
                          placeholder="Typ hier je bericht..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Bericht Verzenden
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}