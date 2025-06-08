import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from '@/components/layout/page-header';
import {
  MessageCircle,
  Send,
  Search,
  User,
  Calendar,
  Bell,
  Mail,
  Phone,
  Filter,
  MessageSquare
} from "lucide-react";

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    name: string;
    role: string;
    photoUrl?: string;
  };
  recipient: {
    id: number;
    name: string;
  };
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  hasAttachment: boolean;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    role: string;
  };
  publishDate: string;
  isImportant: boolean;
  category: string;
}

export default function StudentCommunications() {
  const [selectedTab, setSelectedTab] = useState("messages");
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
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

  const { data: messages, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/student/messages'],
    retry: false,
  });

  const { data: announcements } = useQuery<{ announcements: Announcement[] }>({
    queryKey: ['/api/student/announcements'],
    retry: false,
  });

  const { data: stats } = useQuery<{ unreadCount: number; importantCount: number }>({
    queryKey: ['/api/student/communications/stats'],
    retry: false,
  });

  // Get available receivers for students (teachers, staff, classmates)
  const { data: receivers } = useQuery<{ id: number; role: string; name: string }[]>({
    queryKey: ['/api/messages/receivers/student'],
    retry: false,
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      toast({
        title: "Bericht verzonden",
        description: "Je bericht is succesvol verzonden.",
      });
      setIsComposeOpen(false);
      setNewMessage({
        title: "",
        content: "",
        receiverId: 0,
        receiverRole: "",
        type: "general",
        priority: "normal"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verzenden van het bericht.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.title || !newMessage.content || !newMessage.receiverId) {
      toast({
        title: "Velden vereist",
        description: "Vul alle vereiste velden in.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      subject: newMessage.title,
      content: newMessage.content,
      receiverId: newMessage.receiverId,
      receiverRole: newMessage.receiverRole,
      type: newMessage.type,
      priority: newMessage.priority,
    });
  };

  if (messagesLoading) {
    return (
      <div className="p-6 bg-[#f7f9fc] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredMessages = messages?.messages?.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredAnnouncements = announcements?.announcements?.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Clean Page Header - Admin Style */}
      <PageHeader
        title="Communicatie"
        icon={<Mail className="h-5 w-5 text-white" />}
        parent="Student"
        current="Communicatie"
      />
      
      {/* Main content area */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        
        {/* Stats Overview - Admin Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ongelezen Berichten</p>
                  <p className="text-2xl font-bold text-[#1e40af]">{stats?.unreadCount || 0}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Belangrijke Berichten</p>
                  <p className="text-2xl font-bold text-[#1e40af]">{stats?.importantCount || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mededelingen</p>
                  <p className="text-2xl font-bold text-[#1e40af]">{announcements?.announcements?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <Button 
            onClick={() => setIsComposeOpen(true)}
            className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Nieuw Bericht
          </Button>
        </div>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Belangrijke Berichten</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Bell className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">{stats?.importantCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Vereisen aandacht
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Berichten</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <MessageCircle className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e40af]">{messages?.messages?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              In totaal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search - Admin Style */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1 bg-[#f1f5f9] p-1 rounded-lg">
            <button
              onClick={() => setSelectedTab("messages")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedTab === "messages"
                  ? "bg-white text-[#1e40af] shadow-sm"
                  : "text-gray-600 hover:text-[#1e40af]"
              }`}
            >
              Berichten
            </button>
            <button
              onClick={() => setSelectedTab("announcements")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedTab === "announcements"
                  ? "bg-white text-[#1e40af] shadow-sm"
                  : "text-gray-600 hover:text-[#1e40af]"
              }`}
            >
              Mededelingen
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <Filter className="h-4 w-4 mr-2 text-[#1e40af]" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Admin Style */}
      {selectedTab === "messages" ? (
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <MessageCircle className="h-5 w-5 mr-2 text-[#1e40af]" />
              Berichten
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {filteredMessages.length > 0 ? (
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <div key={message.id} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    !message.isRead 
                      ? 'bg-[#eff6ff] border-[#1e40af] border-l-4' 
                      : 'bg-[#f8fafc] border-[#e5e7eb] hover:bg-white'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        {message.sender.photoUrl ? (
                          <AvatarImage src={message.sender.photoUrl} alt={message.sender.name} />
                        ) : (
                          <AvatarFallback className="bg-[#1e40af] text-white text-sm">
                            {message.sender.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 truncate">{message.sender.name}</p>
                            <Badge variant="outline" className="text-xs border-[#e5e7eb]">
                              {message.sender.role}
                            </Badge>
                            {message.isImportant && (
                              <Badge className="bg-[#fef3c7] text-[#d97706] border-[#d97706] text-xs">
                                Belangrijk
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{message.timestamp}</span>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-[#1e40af] rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <h3 className={`text-sm mb-2 truncate ${
                          !message.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}>
                          {message.subject}
                        </h3>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {message.content}
                        </p>
                        
                        {message.hasAttachment && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs border-[#e5e7eb]">
                              📎 Bijlage
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen berichten gevonden</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Probeer een andere zoekterm." : "Je hebt nog geen berichten ontvangen."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Bell className="h-5 w-5 mr-2 text-[#1e40af]" />
              Mededelingen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {filteredAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb] hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        {announcement.isImportant && (
                          <Badge className="bg-[#fef3c7] text-[#d97706] border-[#d97706] text-xs">
                            Belangrijk
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs border-[#e5e7eb]">
                          {announcement.category}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{announcement.publishDate}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{announcement.author.name}</span>
                        <span>•</span>
                        <span>{announcement.author.role}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#1e40af] hover:bg-[#eff6ff]">
                        Meer lezen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen mededelingen gevonden</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Probeer een andere zoekterm." : "Er zijn momenteel geen mededelingen beschikbaar."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compose Message Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuw Bericht</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receiver">Ontvanger</Label>
              <Select
                value={newMessage.receiverId.toString()}
                onValueChange={(value) => {
                  const receiver = receivers?.find(r => r.id.toString() === value);
                  setNewMessage(prev => ({
                    ...prev,
                    receiverId: parseInt(value),
                    receiverRole: receiver?.role || ""
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer ontvanger" />
                </SelectTrigger>
                <SelectContent>
                  {receivers?.map((receiver) => (
                    <SelectItem key={receiver.id} value={receiver.id.toString()}>
                      {receiver.name} ({receiver.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Onderwerp</Label>
              <Input
                id="subject"
                value={newMessage.title}
                onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Voer onderwerp in"
              />
            </div>

            <div>
              <Label htmlFor="content">Bericht</Label>
              <Textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Typ je bericht hier..."
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-3">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newMessage.type}
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Algemeen</SelectItem>
                    <SelectItem value="academic">Academisch</SelectItem>
                    <SelectItem value="question">Vraag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioriteit</Label>
                <Select
                  value={newMessage.priority}
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Laag</SelectItem>
                    <SelectItem value="normal">Normaal</SelectItem>
                    <SelectItem value="high">Hoog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Annuleren
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white"
              >
                {sendMessageMutation.isPending ? "Verzenden..." : "Verzenden"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      </div>
    </div>
  );
}