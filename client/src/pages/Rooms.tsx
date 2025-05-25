import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, 
  Building, MapPin, Users, Check, X, Save, ChevronDown, ChevronUp
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
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
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
  const { data: roomsData = { rooms: [], totalCount: 0 }, isLoading, isError } = useQuery({
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
  const { data: locationsData = { locations: [] } } = useQuery({
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page header - Professionele desktop stijl */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-base font-medium text-gray-800 tracking-tight">Lokalen</h1>
            </div>
            <div className="flex items-center">
              <div className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>
          </div>
          <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
            <div className="text-xs text-gray-500">Beheer &gt; Lokalen</div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of locatie..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Acties */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddRoom}
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Nieuw Lokaal
              </Button>
            </div>
          </div>
          
          {/* Filter opties */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
              <div className="flex items-center">
                {(statusFilter !== 'all' || locationFilter !== 'all') && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setLocationFilter('all');
                    }}
                    className="h-7 text-xs text-blue-600 p-0 mr-3"
                  >
                    Filters wissen
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={statusFilter} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="available">Beschikbaar</SelectItem>
                    <SelectItem value="occupied">Bezet</SelectItem>
                    <SelectItem value="reserved">Gereserveerd</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={locationFilter} 
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Locatie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle locaties</SelectItem>
                    {locations.map((loc: string) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Tabel van lokalen - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-10">
                    <Checkbox 
                      checked={selectedRooms.length > 0 && selectedRooms.length === rooms.length && rooms.length > 0}
                      onCheckedChange={handleSelectAllRooms}
                      className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Naam</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Locatie</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Capaciteit</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-[120px]">
                    <span className="text-xs font-medium text-gray-700">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <X className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-sm text-red-500">Fout bij het laden van lokalen.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/rooms'] })}
                          className="mt-2 h-7 text-xs rounded-sm"
                        >
                          Opnieuw proberen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="py-6">
                        <div className="flex flex-col items-center justify-center">
                          <Building className="h-12 w-12 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Geen lokalen gevonden</h3>
                          <p className="text-sm text-gray-500 max-w-md text-center mb-4">
                            {searchTerm || statusFilter !== 'all' || locationFilter !== 'all' 
                              ? 'Er zijn geen lokalen die voldoen aan de huidige filters.' 
                              : 'Er zijn nog geen lokalen toegevoegd in het systeem.'}
                          </p>
                          {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setLocationFilter('all');
                              }}
                              className="h-8 text-xs rounded-sm"
                            >
                              Filters wissen
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedRooms.includes(room.id)}
                          onCheckedChange={() => handleSelectRoom(room.id)}
                          className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-900">{room.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-500">{room.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(room.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Users className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <span className="text-xs">{room.capacity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRoom(room)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoom(room)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginering */}
          {rooms.length > 0 && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
              <div>
                Resultaten {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalRooms)} van {totalRooms}
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Vorige
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogen */}
      
      {/* Nieuw/bewerk lokaal dialoog */}
      <Dialog open={isDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          isDialogOpen ? setIsDialogOpen(false) : setIsEditDialogOpen(false);
          resetFormData();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Lokaal bewerken' : 'Nieuw lokaal toevoegen'}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Bewerk de gegevens van dit lokaal.'
                : 'Vul de details in om een nieuw lokaal toe te voegen.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam lokaal</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Bijv. Lokaal A101"
                  className="h-8 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capaciteit</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleFormChange('capacity', parseInt(e.target.value) || 0)}
                  placeholder="30"
                  className="h-8 text-sm"
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Locatie</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="Bijv. Gebouw A, 1e verdieping"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleFormChange('status', value)}
                >
                  <SelectTrigger id="status" className="h-8 text-sm">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Beschikbaar</SelectItem>
                    <SelectItem value="occupied">Bezet</SelectItem>
                    <SelectItem value="reserved">Gereserveerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Optionele details over het lokaal..."
                className="min-h-[80px] text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => isDialogOpen ? setIsDialogOpen(false) : setIsEditDialogOpen(false)}
                className="h-8 text-xs rounded-sm"
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {isEditDialogOpen ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details dialoog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lokaal details</DialogTitle>
            <DialogDescription>
              Details van het geselecteerde lokaal.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Algemene informatie</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Naam</span>
                        <span className="text-sm font-medium">{selectedRoom.name}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Locatie</span>
                        <span className="text-sm">{selectedRoom.location}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Capaciteit</span>
                        <span className="text-sm">{selectedRoom.capacity} personen</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs text-gray-500">Status</span>
                        <span>{getStatusBadge(selectedRoom.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Notities</h4>
                    <p className="text-sm border rounded-sm p-3 bg-gray-50 min-h-[100px]">
                      {selectedRoom.notes || "Geen notities beschikbaar"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Aangemaakt/bijgewerkt</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Aangemaakt</span>
                        <span className="text-sm">{new Date(selectedRoom.createdAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs text-gray-500">Laatst bijgewerkt</span>
                        <span className="text-sm">{new Date(selectedRoom.updatedAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Sluiten
            </Button>
            {selectedRoom && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditRoom(selectedRoom);
                  }}
                  className="h-8 text-xs rounded-sm"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Bewerken
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}