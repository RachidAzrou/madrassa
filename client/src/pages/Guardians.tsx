
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, UserCheck, UserCircle, Mail, Home, BookOpen, Phone, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Guardians() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuardians, setSelectedGuardians] = useState<number[]>([]);
  
  // Fetch guardians
  const { data: guardiansData = [] } = useQuery({ 
    queryKey: ["/api/guardians"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Filter guardians based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(guardiansData);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = guardiansData.filter((guardian: any) => {
      return (
        guardian.firstName.toLowerCase().includes(query) ||
        guardian.lastName.toLowerCase().includes(query) ||
        guardian.email.toLowerCase().includes(query) ||
        (guardian.phone && guardian.phone.includes(query))
      );
    });
    
    setSearchResults(filtered);
  }, [searchQuery, guardiansData]);
  
  // Helper functions for selection
  const handleToggleAllGuardians = (checked: boolean) => {
    if (checked) {
      // Select all guardians from current search results
      const ids = searchResults.map((guardian: any) => guardian.id);
      setSelectedGuardians(ids);
    } else {
      // Deselect all
      setSelectedGuardians([]);
    }
  };
  
  const toggleGuardianSelection = (guardianId: number) => {
    setSelectedGuardians(prev => {
      if (prev.includes(guardianId)) {
        return prev.filter(id => id !== guardianId);
      } else {
        return [...prev, guardianId];
      }
    });
  };
  
  // Render
  return (
    <div className="container px-4 md:px-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voogden</h1>
              <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle voogdgegevens</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zoekbalk */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek voogden..."
            className="pl-8 bg-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <Button variant="outline" className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            Exporteren
          </Button>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2 ml-auto">
          <PlusCircle className="h-4 w-4" />
          Nieuwe Voogd
        </Button>
      </div>
      
      {/* Guardians tabel */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] py-3">
                <Checkbox 
                  checked={selectedGuardians.length > 0 && selectedGuardians.length === searchResults.length}
                  onCheckedChange={handleToggleAllGuardians}
                />
              </TableHead>
              <TableHead className="py-3 font-medium">Naam</TableHead>
              <TableHead className="py-3 font-medium">Relatie</TableHead>
              <TableHead className="py-3 font-medium">Studenten</TableHead>
              <TableHead className="text-right w-[120px] py-3 font-medium">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.length > 0 ? (
              searchResults.map((guardian: any) => (
                <TableRow 
                  key={guardian.id} 
                  className="group hover:bg-gray-50 border-b border-gray-200"
                >
                  <TableCell className="py-3">
                    <Checkbox
                      checked={selectedGuardians.includes(guardian.id)}
                      onCheckedChange={() => toggleGuardianSelection(guardian.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {guardian.firstName.charAt(0)}{guardian.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {guardian.firstName} {guardian.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="px-2">
                      {guardian.relationship === "parent" ? "Ouder" : 
                       guardian.relationship === "guardian" ? "Voogd" : 
                       guardian.relationship === "other" ? "Anders" : 
                       guardian.relationship}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center">
                      <span className="text-sm">3 studenten</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  Geen voogden gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

