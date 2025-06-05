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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, Send, Mail, MailOpen, Trash2, Reply, UserPlus, 
  Search, Filter, Download, PlusCircle, Eye, MessageCircle,
  Clock, User, Users, AlertCircle, CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PremiumHeader } from '@/components/layout/premium-header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';

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
  type?: string;
  priority?: string;
  status?: string;
}

interface Receiver {
  id: number;
  role: string;
  name: string;
}

export default function Communications() {
  // Get current user from profile API
  const { data: currentUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  // Type the currentUser properly
  const typedUser = currentUser as { id: number; role: string; firstName: string; lastName: string } | undefined;
  const [selectedTab, setSelectedTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("alle");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    receiverId: 0,
    receiverRole: "",
    type: "general",
    priority: "normal"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Haal berichten op voor de huidige gebruiker met automatic refresh
  const { data: inboxMessages = [], isLoading: isLoadingInbox } = useQuery({
    queryKey: [`/api/messages/receiver/${typedUser?.id}/${typedUser?.role}`],
    enabled: !!typedUser,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
    queryKey: [`/api/messages/sender/${typedUser?.id}/${typedUser?.role}`],
    enabled: !!typedUser,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Haal mogelijke ontvangers op met role-based filtering
  const { data: receivers = [], isLoading: isLoadingReceivers } = useQuery({
    queryKey: [`/api/messages/receivers/${typedUser?.id}/${typedUser?.role}`],
    enabled: !!typedUser,
    refetchInterval: 60000,
  });

  // Markeer bericht als gelezen
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/messages/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/receiver/${typedUser?.id}/${typedUser?.role}`] });
    },
  });

  // Verstuur nieuw bericht
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest("/api/messages", {
        method: "POST",
        body: {
          ...messageData,
          senderId: typedUser?.id,
          senderRole: typedUser?.role,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/sender/${typedUser?.id}/${typedUser?.role}`] });
      toast({ title: "Bericht succesvol verzonden!" });
      setIsComposeOpen(false);
      setNewMessage({
        title: "",
        content: "",
        receiverId: 0,
        receiverRole: "",
        type: "general",
        priority: "normal"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verzenden",
        description: error.message || "Er ging iets mis bij het verzenden van het bericht.",
        variant: "destructive",
      });
    },
  });

  // Verwijder bericht
  const deleteMessageMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/receiver/${typedUser?.id}/${typedUser?.role}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/sender/${typedUser?.id}/${typedUser?.role}`] });
      toast({ title: "Bericht verwijderd" });
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er ging iets mis bij het verwijderen van het bericht.",
        variant: "destructive",
      });
    },
  });

  // Filter messages
  const currentMessages = selectedTab === "inbox" ? inboxMessages : sentMessages;
  const filteredMessages = currentMessages.filter((message: Message) => {
    const matchesSearch = searchQuery === '' || 
      message.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.senderName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'alle' || message.type === typeFilter;
    const matchesStatus = statusFilter === 'alle' || 
      (statusFilter === 'gelezen' && message.isRead) ||
      (statusFilter === 'ongelezen' && !message.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Helper functions
  const getMessageTypeBadge = (type: string) => {
    const typeConfig = {
      general: { label: 'Algemeen', className: 'bg-blue-100 text-blue-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
      announcement: { label: 'Aankondiging', className: 'bg-green-100 text-green-800' },
      reminder: { label: 'Herinnering', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.general;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Laag', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normaal', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Hoog', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const handleSendMessage = () => {
    if (!newMessage.title || !newMessage.content || !newMessage.receiverId) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate(newMessage);
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && selectedTab === "inbox") {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    deleteMessageMutation.mutate(message.id);
  };

  // Export functionality
  const handleExport = () => {
    const headers = ['Datum', 'Van/Naar', 'Onderwerp', 'Type', 'Status'];
    const csvData = filteredMessages.map((message: Message) => [
      new Date(message.sentAt).toLocaleDateString('nl-NL'),
      selectedTab === 'inbox' ? message.senderName || 'Onbekend' : message.receiverName || 'Onbekend',
      message.title,
      message.type || 'Algemeen',
      message.isRead ? 'Gelezen' : 'Ongelezen'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `berichten_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export voltooid",
      description: "Berichten zijn geëxporteerd naar CSV bestand.",
    });
  };

  // Calculate statistics
  const totalMessages = inboxMessages.length + sentMessages.length;
  const unreadMessages = inboxMessages.filter((m: Message) => !m.isRead).length;
  const sentToday = sentMessages.filter((m: Message) => 
    new Date(m.sentAt).toDateString() === new Date().toDateString()
  ).length;

  if (isAuthLoading || isLoadingInbox || isLoadingSent) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={MessageCircle}
          title="Communicatie"
          description="Beheer alle berichten en communicatie"
          breadcrumbs={{
            parent: "Secretariaat",
            current: "Communicatie"
          }}
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header */}
      <PremiumHeader
        icon={MessageCircle}
        title="Communicatie"
        description="Beheer alle berichten en communicatie"
        breadcrumbs={{
          parent: "Secretariaat",
          current: "Communicatie"
        }}
      />

      {/* Main Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Berichten</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Alle berichten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongelezen</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{unreadMessages}</div>
              <p className="text-xs text-muted-foreground">
                Nieuwe berichten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verzonden Vandaag</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{sentToday}</div>
              <p className="text-xs text-muted-foreground">
                Berichten verstuurd
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ontvangers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{receivers.length}</div>
              <p className="text-xs text-muted-foreground">
                Beschikbare contacten
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Zoek berichten..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
                <Button
                  onClick={() => setIsComposeOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nieuw Bericht
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle types</SelectItem>
                    <SelectItem value="general">Algemeen</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="announcement">Aankondiging</SelectItem>
                    <SelectItem value="reminder">Herinnering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="ongelezen">Ongelezen</SelectItem>
                    <SelectItem value="gelezen">Gelezen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Postvak IN ({inboxMessages.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Verzonden ({sentMessages.length})
            </TabsTrigger>
          </TabsList>

          {/* Messages List */}
          <TabsContent value={selectedTab} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedTab === 'inbox' ? 'Ontvangen Berichten' : 'Verzonden Berichten'} ({filteredMessages.length})
                    </CardTitle>
                    <CardDescription>
                      {selectedTab === 'inbox' 
                        ? 'Berichten ontvangen van andere gebruikers'
                        : 'Berichten die u heeft verzonden'
                      }
                    </CardDescription>
                  </div>
                  
                  {selectedMessages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {selectedMessages.length} geselecteerd
                      </span>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Verwijderen
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Geen berichten</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedTab === 'inbox' 
                          ? 'U heeft nog geen berichten ontvangen.'
                          : 'U heeft nog geen berichten verzonden.'
                        }
                      </p>
                      {selectedTab === 'inbox' ? null : (
                        <div className="mt-6">
                          <Button onClick={() => setIsComposeOpen(true)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Nieuw Bericht
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedMessages.length === filteredMessages.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMessages(filteredMessages.map((m: Message) => m.id));
                                } else {
                                  setSelectedMessages([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>
                            {selectedTab === 'inbox' ? 'Van' : 'Naar'}
                          </TableHead>
                          <TableHead>Onderwerp</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMessages.map((message: Message) => (
                          <TableRow 
                            key={message.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${!message.isRead && selectedTab === 'inbox' ? 'font-medium' : ''}`}
                            onClick={() => handleMessageClick(message)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedMessages.includes(message.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMessages([...selectedMessages, message.id]);
                                  } else {
                                    setSelectedMessages(selectedMessages.filter(id => id !== message.id));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                    {selectedTab === 'inbox' 
                                      ? (message.senderName || 'ON').split(' ').map(n => n[0]).join('')
                                      : (message.receiverName || 'ON').split(' ').map(n => n[0]).join('')
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedTab === 'inbox' 
                                      ? message.senderName || 'Onbekend'
                                      : message.receiverName || 'Onbekend'
                                    }
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {message.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {message.content}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getMessageTypeBadge(message.type || 'general')}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {format(new Date(message.sentAt), 'dd MMM yyyy', { locale: nl })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(message.sentAt), 'HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              {selectedTab === 'inbox' ? (
                                message.isRead ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Gelezen
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Ongelezen
                                  </Badge>
                                )
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Send className="h-3 w-3 mr-1" />
                                  Verzonden
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMessageClick(message);
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Bekijken</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMessage(message);
                                        }}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verwijderen</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Message Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuw Bericht Opstellen</DialogTitle>
            <DialogDescription>
              Verstuur een bericht naar een andere gebruiker
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiver">Ontvanger *</Label>
                <Select 
                  value={`${newMessage.receiverId}-${newMessage.receiverRole}`} 
                  onValueChange={(value) => {
                    const [receiverId, receiverRole] = value.split('-');
                    setNewMessage({
                      ...newMessage, 
                      receiverId: parseInt(receiverId), 
                      receiverRole
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer ontvanger" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivers.map((receiver: Receiver) => (
                      <SelectItem key={`${receiver.id}-${receiver.role}`} value={`${receiver.id}-${receiver.role}`}>
                        {receiver.name} ({receiver.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={newMessage.type} 
                  onValueChange={(value) => setNewMessage({...newMessage, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Algemeen</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="announcement">Aankondiging</SelectItem>
                    <SelectItem value="reminder">Herinnering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="title">Onderwerp *</Label>
              <Input
                id="title"
                value={newMessage.title}
                onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                placeholder="Voer het onderwerp in..."
              />
            </div>
            
            <div>
              <Label htmlFor="content">Bericht *</Label>
              <Textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="Typ hier uw bericht..."
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
              Annuleren
            </Button>
            <Button 
              type="submit"
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Bericht Verzenden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.title}</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <div className="flex items-center space-x-4 text-sm">
                  <span>
                    Van: {selectedTab === 'inbox' 
                      ? selectedMessage.senderName || 'Onbekend'
                      : 'U'
                    }
                  </span>
                  <span>
                    Naar: {selectedTab === 'inbox' 
                      ? 'U'
                      : selectedMessage.receiverName || 'Onbekend'
                    }
                  </span>
                  <span>
                    {format(new Date(selectedMessage.sentAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getMessageTypeBadge(selectedMessage.type || 'general')}
                {selectedMessage.priority && getPriorityBadge(selectedMessage.priority)}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              Sluiten
            </Button>
            {selectedMessage && (
              <Button
                variant="destructive"
                onClick={() => handleDeleteMessage(selectedMessage)}
                disabled={deleteMessageMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}