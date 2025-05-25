import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, Mail, MailOpen, Trash2, Reply, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

// Huidige gebruiker (Dit zou normaal gesproken uit een authenticatiecontext komen)
// Voor demonstratie gebruiken we een admin gebruiker
const currentUser = {
  id: 1,
  role: "admin",
  name: "Admin Gebruiker"
};

export default function Messages() {
  const [selectedTab, setSelectedTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    receiverId: 0,
    receiverRole: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Haal berichten op voor de huidige gebruiker
  const { data: inboxMessages, isLoading: isLoadingInbox } = useQuery({
    queryKey: ["/api/messages/receiver", currentUser.id, currentUser.role],
    queryFn: () => apiRequest(`/api/messages/receiver/${currentUser.id}/${currentUser.role}`),
  });

  const { data: sentMessages, isLoading: isLoadingSent } = useQuery({
    queryKey: ["/api/messages/sender", currentUser.id, currentUser.role],
    queryFn: () => apiRequest(`/api/messages/sender/${currentUser.id}/${currentUser.role}`),
  });

  // Haal mogelijke ontvangers op
  const { data: receivers, isLoading: isLoadingReceivers } = useQuery({
    queryKey: ["/api/messages/receivers", currentUser.id, currentUser.role],
    queryFn: () => apiRequest(`/api/messages/receivers/${currentUser.id}/${currentUser.role}`),
  });

  // Markeer bericht als gelezen
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/messages/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/receiver"] });
    },
  });

  // Verstuur een nieuw bericht
  const sendMessageMutation = useMutation({
    mutationFn: (message: any) => apiRequest("/api/messages", {
      method: "POST",
      body: JSON.stringify(message)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sender"] });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Berichten</h1>
        <Button 
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
          <UserPlus className="mr-2 h-4 w-4" />
          Nieuw bericht
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Berichtenlijst */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Berichten</CardTitle>
              <Tabs defaultValue="inbox" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="sent">Verzonden</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {selectedTab === "inbox" && (
                <>
                  {isLoadingInbox ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : inboxMessages && inboxMessages.length > 0 ? (
                    <div className="space-y-2">
                      {inboxMessages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            selectedMessage?.id === message.id
                              ? "bg-primary text-primary-foreground"
                              : message.isRead
                              ? "hover:bg-muted"
                              : "bg-muted/50 hover:bg-muted font-medium"
                          }`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {!message.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                              )}
                              <div>
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                  {formatPersonName(message.senderId, message.senderRole)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(message.sentAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {!message.isRead ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <MailOpen className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{message.title}</p>
                          <p className="text-xs truncate mt-1">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
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
                    <div className="space-y-2">
                      {sentMessages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            selectedMessage?.id === message.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              Aan: {formatPersonName(message.receiverId, message.receiverRole)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{message.title}</p>
                          <p className="text-xs truncate mt-1">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
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
          <Card className="h-full">
            {selectedMessage ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <CardTitle>{selectedMessage.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleReply}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => deleteMessageMutation.mutate(selectedMessage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {selectedTab === "inbox" 
                              ? formatPersonName(selectedMessage.senderId, selectedMessage.senderRole).charAt(0)
                              : formatPersonName(selectedMessage.receiverId, selectedMessage.receiverRole).charAt(0)
                            }
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {selectedTab === "inbox" 
                            ? `Van: ${formatPersonName(selectedMessage.senderId, selectedMessage.senderRole)}`
                            : `Aan: ${formatPersonName(selectedMessage.receiverId, selectedMessage.receiverRole)}`
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedMessage.sentAt)}
                        </span>
                      </div>
                      <div>
                        <Badge variant={selectedMessage.isRead ? "outline" : "default"}>
                          {selectedMessage.isRead ? "Gelezen" : "Ongelezen"}
                        </Badge>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[200px] whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Selecteer een bericht om de inhoud te bekijken of klik op 'Nieuw bericht' om een bericht te schrijven.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Nieuw bericht dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nieuw bericht</DialogTitle>
            <DialogDescription>
              Schrijf een nieuw bericht naar een student, voogd, docent of administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receiver" className="text-right">
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
                  <SelectTrigger>
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
                        >
                          {receiver.name} ({receiver.role})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Geen ontvangers beschikbaar
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Onderwerp
              </Label>
              <Input
                id="title"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Bericht
              </Label>
              <Textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="col-span-3"
                rows={8}
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