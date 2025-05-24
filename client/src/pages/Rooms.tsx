import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, 
  Building, MapPin, Users, Check, X, Save
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Interface voor een lokaal
interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Rooms() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    capacity: 30,
    location: '',
    status: 'available' as 'available' | 'occupied',
    notes: ''
  });

  // Fetch rooms with filters
  const { data: roomsData, isLoading, isError } = useQuery({
    queryKey: ['/api/rooms', { 
      searchTerm, 
      status: statusFilter, 
      location: locationFilter, 
      page: currentPage 
    }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          searchTerm,
          page: currentPage.toString()
        });
        
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (locationFilter !== 'all') params.append('location', locationFilter);
        
        const result = await apiRequest(`/api/rooms?${params.toString()}`, {
          method: 'GET'
        });
        return result;
      } catch (error: any) {
        console.error('Error fetching rooms data:', error);
        toast({
          title: "Fout bij ophalen lokalen",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de lokalen.",
          variant: "destructive",
        });
        return { rooms: [], totalCount: 0 };
      }
    },
    staleTime: 30000,
  });

  const rooms = roomsData?.rooms || [];
  const totalRooms = roomsData?.totalCount || 0;
  const totalPages = Math.ceil(totalRooms / 10);

  // Fetch unique locations for filter
  const { data: locationsData } = useQuery({
    queryKey: ['/api/rooms/locations'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/rooms/locations', {
          method: 'GET'
        });
        return result;
      } catch (error: any) {
        console.error('Error fetching locations:', error);
        return { locations: [] };
      }
    }
  });

  const locations = locationsData?.locations || [];

  const handleAddRoom = () => {
    setIsDialogOpen(true);
  };
  
  // Mutation voor het toevoegen van een lokaal
  const createRoomMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        return await apiRequest('/api/rooms', {
          method: 'POST',
          body: data
        });
      } catch (error: any) {
        console.error('Error creating room:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van het lokaal');
      }
    },
    onSuccess: () => {
      toast({
        title: "Lokaal toegevoegd",
        description: "Het lokaal is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
      setIsDialogOpen(false);
      resetFormData();
      
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het lokaal.",
        variant: "destructive",
      });
    },
  });

  // Mutation voor het bewerken van een lokaal
  const updateRoomMutation = useMutation({
    mutationFn: async (data: { id: number; roomData: typeof formData }) => {
      try {
        return await apiRequest(`/api/rooms/${data.id}`, {
          method: 'PATCH',
          body: data.roomData
        });
      } catch (error: any) {
        console.error('Error updating room:', error);
        throw new Error(error?.message || 'Fout bij het bijwerken van het lokaal');
      }
    },
    onSuccess: () => {
      toast({
        title: "Lokaal bijgewerkt",
        description: "Het lokaal is succesvol bijgewerkt in het systeem.",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het lokaal.",
        variant: "destructive",
      });
    },
  });

  // Mutation voor het verwijderen van een lokaal
  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/rooms/${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Error deleting room:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van het lokaal');
      }
    },
    onSuccess: () => {
      toast({
        title: "Lokaal verwijderd",
        description: "Het lokaal is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het lokaal.",
        variant: "destructive",
      });
    },
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      capacity: 30,
      location: '',
      status: 'available',
      notes: ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valideer formulier
      if (!formData.name || !formData.capacity) {
        toast({
          title: "Onvolledige gegevens",
          description: "Vul alle verplichte velden in om een lokaal toe te voegen.",
          variant: "destructive",
        });
        return;
      }
      
      if (isEditDialogOpen && selectedRoom) {
        updateRoomMutation.mutate({
          id: selectedRoom.id,
          roomData: formData
        });
      } else {
        createRoomMutation.mutate(formData);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Fout bij verwerken",
        description: error?.message || "Er is een fout opgetreden bij het verwerken van het formulier.",
        variant: "destructive",
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsViewDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      status: room.status,

      notes: room.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRoom = (room: Room) => {
    if (window.confirm(`Weet u zeker dat u lokaal "${room.name}" wilt verwijderen?`)) {
      deleteRoomMutation.mutate(room.id);
    }
  };
  
  const handleSelectRoom = (roomId: number) => {
    setSelectedRooms((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };
  
  const handleSelectAllRooms = (checked: boolean) => {
    if (checked) {
      const allRoomIds = rooms.map((room) => room.id);
      setSelectedRooms(allRoomIds);
    } else {
      setSelectedRooms([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-[#e8f4ff] text-[#1e3a8a] border-[#bfdcff]">Beschikbaar</Badge>;
      case 'occupied':
        return <Badge variant="outline" className="bg-[#f5f5f5] text-[#64748b] border-[#e2e8f0]">Bezet</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]">Gereserveerd</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Onbekend</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Lokalen</h1>
                <p className="text-base text-blue-100 mt-1">Beheer alle lokalen in het schoolgebouw</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full mb-4 relative">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Zoek op naam, locatie..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleAddRoom}
            className="bg-[#1e3a8a] hover:bg-[#1e40af]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Lokaal Toevoegen
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-md border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">
                    <Checkbox 
                      checked={selectedRooms.length === rooms.length && rooms.length > 0}
                      onCheckedChange={handleSelectAllRooms}
                      aria-label="Selecteer alle rijen"
                    />
                  </th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">LOKAALNAAM</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">STATUS</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">CAPACITEIT</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-[#1e3a8a] mb-2">
                          <Building className="h-10 w-10 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">
                          {searchTerm 
                            ? `Geen lokalen gevonden voor "${searchTerm}"` 
                            : 'Geen lokalen gevonden'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : rooms.map((room) => (
                  <tr key={room.id} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                    <td className="py-3 px-4">
                      <Checkbox 
                        checked={selectedRooms.includes(room.id)}
                        onCheckedChange={() => handleSelectRoom(room.id)}
                        aria-label={`Selecteer ${room.name}`}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{room.name}</td>
                    <td className="py-3 px-4">{getStatusBadge(room.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        {room.capacity}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleViewRoom(room)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDeleteRoom(room)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 py-4 border-t">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(i + 1)}
                className={currentPage === i + 1 ? "bg-[#1e3a8a]" : ""}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Lokaal Toevoegen Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[85%] p-0 h-[85vh] max-h-[85vh]">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Lokaal Toevoegen
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium mt-1">
                    Voeg een nieuw lokaal toe aan het systeem
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 cursor-pointer"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Sluiten</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-5 overflow-y-auto" style={{ height: "calc(85vh - 170px)" }}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Lokaalnaam <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Bijv. Lokaal A1-01"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'available' | 'occupied') => handleFormChange('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Beschikbaar</SelectItem>
                        <SelectItem value="occupied">Bezet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capaciteit <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      id="capacity"
                      min={1}
                      value={formData.capacity || ""}
                      onChange={(e) => handleFormChange('capacity', parseInt(e.target.value))}
                      placeholder="Aantal studenten"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Locatie <span className="text-red-500">*</span></Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      placeholder="Bijv. Gebouw A, 1e verdieping"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Bijzonderheden over dit lokaal"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Lokaal Opslaan
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Lokaal Bewerken Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[85%] p-0 h-[85vh] max-h-[85vh]">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Lokaal Bewerken
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium mt-1">
                    Wijzig de gegevens van het lokaal
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 cursor-pointer"
                onClick={() => setIsEditDialogOpen(false)}
              >
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Sluiten</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-5 overflow-y-auto" style={{ height: "calc(85vh - 170px)" }}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Lokaalnaam <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Bijv. Lokaal A1-01"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'available' | 'occupied') => handleFormChange('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Beschikbaar</SelectItem>
                        <SelectItem value="occupied">Bezet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capaciteit <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      id="capacity"
                      min={1}
                      value={formData.capacity || ""}
                      onChange={(e) => handleFormChange('capacity', parseInt(e.target.value))}
                      placeholder="Aantal studenten"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Locatie <span className="text-red-500">*</span></Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      placeholder="Bijv. Gebouw A, 1e verdieping"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Bijzonderheden over dit lokaal"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  Wijzigingen Opslaan
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Lokaal Bekijken Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[85%] p-0 max-h-[85vh]">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Lokaal Details
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium mt-1">
                    {selectedRoom?.name}
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 cursor-pointer"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Sluiten</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-5">
            {selectedRoom && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basis Informatie</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Naam:</span>
                        <p className="text-gray-900">{selectedRoom.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Capaciteit:</span>
                        <p className="text-gray-900 flex items-center gap-1">
                          <Users className="h-4 w-4" /> {selectedRoom.capacity} personen
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Locatie:</span>
                        <p className="text-gray-900 flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {selectedRoom.location}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <p className="mt-1">{getStatusBadge(selectedRoom.status)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Extra Informatie</h3>
                    <div className="space-y-3">

                      <div>
                        <span className="text-sm font-medium text-gray-500">Notities:</span>
                        <p className="text-gray-900 whitespace-pre-line">{selectedRoom.notes || "-"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Aangemaakt op:</span>
                        <p className="text-gray-900">
                          {new Date(selectedRoom.createdAt).toLocaleDateString('nl-NL', { 
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Laatst bijgewerkt:</span>
                        <p className="text-gray-900">
                          {new Date(selectedRoom.updatedAt).toLocaleDateString('nl-NL', { 
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t">
            <div className="flex items-center justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Sluiten
              </Button>
              {selectedRoom && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditRoom(selectedRoom);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}