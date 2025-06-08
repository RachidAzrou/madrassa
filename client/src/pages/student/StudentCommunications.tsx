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
    avatar?: string;
  };
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  type: 'message' | 'announcement';
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  priority: 'low' | 'normal' | 'high';
  category: string;
}

interface CommunicationStats {
  unreadCount: number;
  importantCount: number;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  subject: string;
}

export default function StudentCommunications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'messages' | 'announcements'>('messages');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    receiverId: 0,
    receiverRole: "",
    type: "general",
    priority: "normal"
  });

  // Fetch communication stats
  const { data: stats } = useQuery<{ stats: CommunicationStats }>({
    queryKey: ['/api/student/communications/stats'],
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/student/messages'],
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ['/api/student/announcements'],
  });

  // Fetch available message receivers (teachers)
  const { data: receivers } = useQuery({
    queryKey: ['/api/messages/receivers/student'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/student/communications/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verzenden",
        description: error.message || "Er ging iets mis bij het verzenden van je bericht.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.title.trim() || !newMessage.content.trim() || !newMessage.receiverId) {
      toast({
        title: "Velden ontbreken",
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
                  <p className="text-2xl font-bold text-[#1e40af]">{stats?.stats?.unreadCount || 0}</p>
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
                  <p className="text-2xl font-bold text-[#1e40af]">{stats?.stats?.importantCount || 0}</p>
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

        {/* Messages and Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Messages */}
          <Card className="bg-white border border-[#e5e7eb] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Berichten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        message.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{message.subject}</h4>
                        <Badge variant={message.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {message.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Van: {message.sender.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Geen berichten gevonden</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="bg-white border border-[#e5e7eb] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Mededelingen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((announcement: Announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{announcement.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {announcement.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcement.content}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">Door: {announcement.author}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(announcement.publishedAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Geen mededelingen gevonden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Details Dialog */}
        {selectedMessage && (
          <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMessage.sender.avatar} />
                    <AvatarFallback>
                      {selectedMessage.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMessage.sender.name}</p>
                    <p className="text-sm text-gray-500">{selectedMessage.sender.role}</p>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700">{selectedMessage.content}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    {new Date(selectedMessage.createdAt).toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Compose Message Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuw Bericht</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receiver">Ontvanger</Label>
                  <Select
                    value={newMessage.receiverId.toString()}
                    onValueChange={(value) => {
                      const receiver = receivers?.receivers?.find((r: Teacher) => r.id.toString() === value);
                      setNewMessage(prev => ({
                        ...prev,
                        receiverId: parseInt(value),
                        receiverRole: 'teacher'
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer ontvanger" />
                    </SelectTrigger>
                    <SelectContent>
                      {receivers?.receivers?.map((receiver: Teacher) => (
                        <SelectItem key={receiver.id} value={receiver.id.toString()}>
                          {receiver.name} - {receiver.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioriteit</Label>
                  <Select
                    value={newMessage.priority}
                    onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normaal</SelectItem>
                      <SelectItem value="high">Hoog</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Onderwerp</Label>
                <Input
                  id="title"
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
              <div className="flex justify-end space-x-3">
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