import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, Send, Mail, MailOpen, Trash2, Reply, UserPlus, 
  Search, Filter, Download, PlusCircle, Eye, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PremiumHeader } from '@/components/layout/premium-header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EmptyState from '@/components/ui/empty-state';

// Types voor de berichtenmodule
interface Message {
  id: number;
  senderId: number;
  senderRole: string;
  receiverId: number;
  receiverRole: string;
  title: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  attachmentUrl?: string;
  parentMessageId?: number;
  senderName?: string;
  receiverName?: string;
}

interface Receiver {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
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

const QuickActions = ({ onView, onReply, onDelete }: { onView: () => void, onReply: () => void, onDelete: () => void }) => (
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
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onReply}>
            <Reply className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Beantwoorden</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function Communications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Form data
  const [composeForm, setComposeForm] = useState({
    receiverId: '',
    receiverRole: '',
    title: '',
    content: '',
    attachment: null as File | null,
  });

  const [replyForm, setReplyForm] = useState({
    content: '',
    attachment: null as File | null,
  });

  // Data fetching
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages/receiver/5/secretariat'],
    staleTime: 30000,
  });

  const { data: receivers = [] } = useQuery<Receiver[]>({
    queryKey: ['/api/users/receivers'],
    staleTime: 60000,
  });

  // Filter messages
  const filteredMessages = messages.filter((message: Message) => {
    const matchesSearch = searchTerm === '' || 
      message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.senderName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && message.isRead) ||
      (statusFilter === 'unread' && !message.isRead);
    
    const matchesRole = roleFilter === 'all' || message.senderRole === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setIsComposeDialogOpen(false);
      setComposeForm({
        receiverId: '',
        receiverRole: '',
        title: '',
        content: '',
        attachment: null,
      });
      toast({
        title: "Bericht verzonden",
        description: "Het bericht is succesvol verzonden.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verzenden",
        description: error.message || "Er is een fout opgetreden bij het verzenden van het bericht.",
        variant: "destructive",
      });
    },
  });

  const replyMessageMutation = useMutation({
    mutationFn: async ({ messageId, replyData }: { messageId: number, replyData: any }) => {
      const response = await apiRequest('POST', `/api/messages/${messageId}/reply`, replyData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setIsReplyDialogOpen(false);
      setReplyForm({
        content: '',
        attachment: null,
      });
      toast({
        title: "Antwoord verzonden",
        description: "Het antwoord is succesvol verzonden.",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('PUT', `/api/messages/${messageId}/mark-read`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('DELETE', `/api/messages/${messageId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Bericht verwijderd",
        description: "Het bericht is succesvol verwijderd.",
      });
    },
  });

  // Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!composeForm.receiverId || !composeForm.title || !composeForm.content) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      receiverId: parseInt(composeForm.receiverId),
      receiverRole: composeForm.receiverRole,
      title: composeForm.title,
      content: composeForm.content,
      senderRole: 'secretariat',
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleReplyMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMessage || !replyForm.content) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    const replyData = {
      content: replyForm.content,
      senderRole: 'secretariat',
    };

    replyMessageMutation.mutate({
      messageId: selectedMessage.id,
      replyData,
    });
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsReplyDialogOpen(true);
  };

  const handleDeleteMessage = (message: Message) => {
    if (confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
      deleteMessageMutation.mutate(message.id);
    }
  };

  const getStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge className="bg-gray-100 text-gray-800 text-xs">
        <MailOpen className="h-3 w-3 mr-1" />
        Gelezen
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 text-xs">
        <Mail className="h-3 w-3 mr-1" />
        Nieuw
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      teacher: { label: 'Docent', className: 'bg-green-100 text-green-800' },
      guardian: { label: 'Voogd', className: 'bg-orange-100 text-orange-800' },
      student: { label: 'Student', className: 'bg-blue-100 text-blue-800' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${config.className} text-xs`}>{config.label}</Badge>;
  };

  // Statistics
  const unreadCount = messages.filter((message: Message) => !message.isRead).length;
  const totalMessages = messages.length;

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Communicatie" 
        description="Beheer berichten en communicatie met studenten, docenten en voogden"
        icon={MessageCircle}
        breadcrumbs={{
          parent: "Secretariaat",
          current: "Communicatie"
        }}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Totaal berichten</p>
                <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MailOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ongelezen</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verzonden</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DataTableContainer>
        <SearchActionBar>
          {/* Zoekbalk */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek berichten..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Acties */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Exporteer berichten"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={() => setIsComposeDialogOpen(true)}
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white ml-auto"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Nieuw Bericht
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter opties */}
        {showFilterOptions && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              {(statusFilter !== 'all' || roleFilter !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setRoleFilter('all');
                  }}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle berichten</SelectItem>
                <SelectItem value="unread" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Ongelezen</SelectItem>
                <SelectItem value="read" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Gelezen</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle rollen</SelectItem>
                <SelectItem value="admin" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Admin</SelectItem>
                <SelectItem value="teacher" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Docent</SelectItem>
                <SelectItem value="guardian" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Voogd</SelectItem>
                <SelectItem value="student" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabel */}
        <TableContainer>
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Van</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Onderwerp</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Rol</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Datum</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Status</TableHead>
                <TableHead className="w-20 px-4 py-3 text-xs font-medium text-gray-700 text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-gray-600">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <EmptyState
                      icon={MessageCircle}
                      title="Geen berichten gevonden"
                      description="Er zijn geen berichten die voldoen aan de huidige criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message: Message) => (
                  <TableRow key={message.id} className={`hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50/30' : ''}`}>
                    <TableCell className="px-4 py-3">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {message.senderName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{message.senderName || 'Onbekend'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-900 truncate max-w-xs">
                        {message.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {message.content.substring(0, 60)}...
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getRoleBadge(message.senderRole)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {format(new Date(message.sentAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getStatusBadge(message.isRead)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <QuickActions
                        onView={() => handleViewMessage(message)}
                        onReply={() => handleReplyToMessage(message)}
                        onDelete={() => handleDeleteMessage(message)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Compose Message Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Nieuw Bericht Versturen
            </DialogTitle>
            <DialogDescription>
              Verstuur een bericht naar een gebruiker in het systeem
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiverId">Ontvanger *</Label>
                <Select 
                  value={composeForm.receiverId} 
                  onValueChange={(value) => {
                    const receiver = receivers.find(r => r.id.toString() === value);
                    setComposeForm({
                      ...composeForm,
                      receiverId: value,
                      receiverRole: receiver?.role || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer ontvanger" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivers.map((receiver: Receiver) => (
                      <SelectItem key={receiver.id} value={receiver.id.toString()}>
                        {receiver.firstName} {receiver.lastName} ({receiver.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="title">Onderwerp *</Label>
              <Input
                id="title"
                value={composeForm.title}
                onChange={(e) => setComposeForm({...composeForm, title: e.target.value})}
                placeholder="Onderwerp van het bericht"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content">Bericht *</Label>
              <Textarea
                id="content"
                value={composeForm.content}
                onChange={(e) => setComposeForm({...composeForm, content: e.target.value})}
                placeholder="Typ je bericht hier..."
                rows={6}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={sendMessageMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? 'Verzenden...' : 'Verzenden'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              {selectedMessage?.title}
            </DialogTitle>
            <DialogDescription>
              Van: {selectedMessage?.senderName} • {selectedMessage?.sentAt && format(new Date(selectedMessage.sentAt), 'dd MMM yyyy HH:mm', { locale: nl })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {selectedMessage?.content}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Sluiten
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleReplyToMessage(selectedMessage!);
            }}>
              <Reply className="h-4 w-4 mr-2" />
              Beantwoorden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Message Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-blue-600" />
              Beantwoorden: {selectedMessage?.title}
            </DialogTitle>
            <DialogDescription>
              Antwoord aan: {selectedMessage?.senderName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleReplyMessage} className="space-y-4">
            <div>
              <Label htmlFor="replyContent">Antwoord *</Label>
              <Textarea
                id="replyContent"
                value={replyForm.content}
                onChange={(e) => setReplyForm({...replyForm, content: e.target.value})}
                placeholder="Typ je antwoord hier..."
                rows={6}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={replyMessageMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {replyMessageMutation.isPending ? 'Verzenden...' : 'Antwoord verzenden'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}