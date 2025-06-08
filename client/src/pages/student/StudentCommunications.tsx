import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MessageCircle,
  Send,
  Search,
  User,
  Calendar,
  Bell,
  Mail,
  Phone,
  Filter
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
    <div className="space-y-6">
      {/* Header - Admin Style */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Communicatie
            </h1>
            <p className="text-gray-600">
              Berichten en mededelingen van je school
            </p>
          </div>

        </div>
      </div>

      {/* Stats Overview - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Ongelezen Berichten</CardTitle>
            <div className="p-2 bg-[#fef2f2] rounded-lg">
              <Mail className="h-4 w-4 text-[#dc2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#dc2626]">{stats?.unreadCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Nieuwe berichten
            </p>
          </CardContent>
        </Card>

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
    </div>
  );
}