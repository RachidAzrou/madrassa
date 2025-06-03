import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

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
import { 
  Loader2, Send, Mail, MailOpen, Trash2, Reply, UserPlus, 
  Search, Filter, Download, PlusCircle, Eye, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  DataTableContainer, 
  SearchActionLayout,
  TableContainer,
  DataTableHeader, 
  ActionButtonsContainer,
  EmptyActionHeader
} from '@/components/ui/data-table-container';

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
}

interface Receiver {
  id: number;
  role: string;
  name: string;
}

export default function Messages() {
  // Get current user from profile API
  const { data: currentUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/profile"],
  });
  const [selectedTab, setSelectedTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    receiverId: 0,
    receiverRole: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    window.location.href = "/api/login";
    return null;
  }

  // Automatic refresh voor berichten elke 30 seconden
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/receiver"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sender"] });
    }, 30000); // 30 seconden

    return () => clearInterval(interval);
  }, [queryClient, currentUser]);

  // Haal berichten op voor de huidige gebruiker met automatic refresh
  const { data: inboxMessages, isLoading: isLoadingInbox } = useQuery({
    queryKey: ["/api/messages/receiver", currentUser?.id, currentUser?.role],
    enabled: !!currentUser,
    refetchInterval: 30000, // Auto-refresh elke 30 seconden
    refetchIntervalInBackground: true,
  });

  const { data: sentMessages, isLoading: isLoadingSent } = useQuery({
    queryKey: ["/api/messages/sender", currentUser?.id, currentUser?.role],
    enabled: !!currentUser,
    refetchInterval: 30000, // Auto-refresh elke 30 seconden
    refetchIntervalInBackground: true,
  });

  // Haal mogelijke ontvangers op met role-based filtering
  const { data: receivers, isLoading: isLoadingReceivers } = useQuery({
    queryKey: ["/api/messages/receivers", currentUser?.id, currentUser?.role],
    enabled: !!currentUser,
    refetchInterval: 60000, // Minder frequent voor ontvangers lijst
  });

  // Markeer bericht als gelezen
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/messages/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/receiver"] });
    },
  });

  // Verstuur een nieuw bericht met role-based validation
  const sendMessageMutation = useMutation({
    mutationFn: (message: any) => apiRequest("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        ...message,
        senderId: currentUser.id,
        senderRole: currentUser.role
      })
    }),
    onSuccess: () => {
      // Refresh beide query caches voor real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sender"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/receiver"] });
      setIsComposeOpen(false);
      setNewMessage({
        title: "",
        content: "",
        receiverId: 0,
        receiverRole: ""
      });
      toast({
        title: "Bericht verstuurd",
        description: "Je bericht is succesvol verstuurd.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij versturen",
        description: "Er is een fout opgetreden bij het versturen van je bericht.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    }
  });

  // Verwijder een bericht
  const deleteMessageMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/receiver"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sender"] });
      setSelectedMessage(null);
      toast({
        title: "Bericht verwijderd",
        description: "Het bericht is succesvol verwijderd.",
        variant: "default",
      });
    },
  });

  // Antwoord op een bericht
  const handleReply = () => {
    if (!selectedMessage) return;
    
    setNewMessage({
      title: `RE: ${selectedMessage.title}`,
      content: "",
      receiverId: selectedMessage.senderId,
      receiverRole: selectedMessage.senderRole
    });
    setIsComposeOpen(true);
  };

  // Verstuur een nieuw bericht
  const handleSendMessage = () => {
    if (!newMessage.receiverId || !newMessage.receiverRole || !newMessage.title || !newMessage.content) {
      toast({
        title: "Ontbrekende gegevens",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    const messageToSend = {
      senderId: currentUser.id,
      senderRole: currentUser.role,
      receiverId: newMessage.receiverId,
      receiverRole: newMessage.receiverRole,
      title: newMessage.title,
      content: newMessage.content,
      parentMessageId: selectedMessage?.id
    };

    sendMessageMutation.mutate(messageToSend);
  };

  // Toon bericht details en markeer als gelezen indien nodig
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    
    if (!message.isRead && selectedTab === "inbox") {
      markAsReadMutation.mutate(message.id);
    }
  };

  // Helper functie om afzender/ontvanger te formatteren
  const formatPersonName = (id: number, role: string): string => {
    if (receivers) {
      const person = receivers.find((r: Receiver) => r.id === id && r.role === role);
      return person ? person.name : `${role} #${id}`;
    }
    return `${role} #${id}`;
  };

  // Helper functie om datum te formatteren
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMMM yyyy 'om' HH:mm", { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PremiumHeader 
        title="Berichten"
        subtitle="Beheer communicatie met studenten, docenten en voogden"
        icon={MessageCircle}
      />

      <DataTableContainer>
        {/* Zoek- en actiesbalk */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4 shadow-sm">
          <SearchActionLayout>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Zoeken..." 
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs rounded-sm border-[#e5e7eb] bg-white hover:bg-blue-50"
              >
                <Filter className="h-3.5 w-3.5 mr-1 text-gray-500" />
                <span>Filter</span>
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
                onClick={() => {
                  setSelectedMessage(null);
                  setNewMessage({
                    title: "",
                    content: "",
                    receiverId: 0,
                    receiverRole: ""
                  });
                  setIsComposeOpen(true);
                }}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                <span>Nieuw bericht</span>
              </Button>
            </div>
          </SearchActionLayout>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Berichtenlijst */}
          <div className="md:col-span-1">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-semibold">Berichten</CardTitle>
                <Tabs defaultValue="inbox" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="inbox">Inbox</TabsTrigger>
                    <TabsTrigger value="sent">Verzonden</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-0">
                {selectedTab === "inbox" && (
                  <>
                    {isLoadingInbox ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : inboxMessages && inboxMessages.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {inboxMessages.map((message: Message) => (
                          <div
                            key={message.id}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedMessage?.id === message.id
                                ? "bg-blue-50"
                                : message.isRead
                                ? "hover:bg-gray-50"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => handleViewMessage(message)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className="bg-primary text-white">
                                    {formatPersonName(message.senderId, message.senderRole).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[160px]">
                                    {formatPersonName(message.senderId, message.senderRole)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(message.sentAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {!message.isRead ? (
                                <Badge variant="default" className="text-xs h-5 bg-blue-500">Nieuw</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium truncate">{message.title}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <p>Geen berichten in je inbox</p>
                      </div>
                    )}
                  </>
                )}

                {selectedTab === "sent" && (
                  <>
                    {isLoadingSent ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : sentMessages && sentMessages.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {sentMessages.map((message: Message) => (
                          <div
                            key={message.id}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedMessage?.id === message.id
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleViewMessage(message)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className="bg-gray-400 text-white">
                                    {formatPersonName(message.receiverId, message.receiverRole).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[160px]">
                                    Aan: {formatPersonName(message.receiverId, message.receiverRole)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(message.sentAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs h-5">Verzonden</Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium truncate">{message.title}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <p>Geen verzonden berichten</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Berichtdetails */}
          <div className="md:col-span-2">
            <Card className="h-full border border-gray-200 shadow-sm">
              {selectedMessage ? (
                <>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">{selectedMessage.title}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={selectedTab === "inbox" ? "bg-primary text-white" : "bg-gray-400 text-white"}>
                                  {selectedTab === "inbox" 
                                    ? formatPersonName(selectedMessage.senderId, selectedMessage.senderRole).charAt(0)
                                    : formatPersonName(selectedMessage.receiverId, selectedMessage.receiverRole).charAt(0)
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {selectedTab === "inbox" 
                                  ? `Van: ${formatPersonName(selectedMessage.senderId, selectedMessage.senderRole)}`
                                  : `Aan: ${formatPersonName(selectedMessage.receiverId, selectedMessage.receiverRole)}`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                {formatDate(selectedMessage.sentAt)}
                              </span>
                            </div>
                            <div>
                              <Badge variant={selectedMessage.isRead ? "outline" : "default"} className="text-xs h-5">
                                {selectedMessage.isRead ? "Gelezen" : "Ongelezen"}
                              </Badge>
                            </div>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleReply}
                          className="h-8 px-2"
                        >
                          <Reply className="h-3.5 w-3.5 mr-1" />
                          <span>Beantwoorden</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteMessageMutation.mutate(selectedMessage.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span>Verwijderen</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="min-h-[300px] whitespace-pre-wrap text-sm">
                      {selectedMessage.content}
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Mail className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center max-w-md">
                    Selecteer een bericht om de inhoud te bekijken of klik op 'Nieuw bericht' om een bericht te schrijven.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DataTableContainer>

      {/* Nieuw bericht dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-primary">Nieuw bericht</DialogTitle>
            <DialogDescription>
              Schrijf een nieuw bericht naar een student, voogd, docent of administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receiver" className="text-xs font-medium text-gray-700 text-right">
                Ontvanger
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => {
                    const [id, role] = value.split("|");
                    setNewMessage({
                      ...newMessage,
                      receiverId: parseInt(id),
                      receiverRole: role
                    });
                  }}
                  value={newMessage.receiverId && newMessage.receiverRole ? `${newMessage.receiverId}|${newMessage.receiverRole}` : ""}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                    <SelectValue placeholder="Selecteer een ontvanger" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingReceivers ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : receivers && receivers.length > 0 ? (
                      receivers.map((receiver: Receiver) => (
                        <SelectItem 
                          key={`${receiver.id}-${receiver.role}`} 
                          value={`${receiver.id}|${receiver.role}`}
                          className="text-black hover:bg-blue-100 focus:bg-blue-200"
                        >
                          {receiver.name} ({receiver.role})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Geen ontvangers beschikbaar
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-xs font-medium text-gray-700 text-right">
                Onderwerp
              </Label>
              <Input
                id="title"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-xs font-medium text-gray-700 text-right mt-2">
                Bericht
              </Label>
              <Textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="col-span-3 min-h-[200px] border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsComposeOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </Button>
            <Button 
              type="submit" 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {sendMessageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              Versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}