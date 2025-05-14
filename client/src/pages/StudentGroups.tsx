import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentGroups() {
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('all');
  const [program, setProgram] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch student groups with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/student-groups', { searchTerm, academicYear, program, page: currentPage }],
    staleTime: 30000,
  });

  const studentGroups = data?.studentGroups || [];
  const totalStudentGroups = data?.totalCount || 0;
  const totalPages = Math.ceil(totalStudentGroups / 9); // Assuming 9 groups per page for grid layout

  const handleAddStudentGroup = async () => {
    // Implementation will be added for student group creation
    console.log('Add student group clicked');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setCurrentPage(1);
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Studentengroepen</h1>
          <p className="text-gray-500 mt-1">
            Beheer studentengroepen, secties en activiteitengroepen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek groepen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddStudentGroup} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Groep Aanmaken</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academisch Jaar</label>
            <Select value={academicYear} onValueChange={handleAcademicYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Jaren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jaren</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opleiding</label>
            <Select value={program} onValueChange={handleProgramChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Opleidingen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Opleidingen</SelectItem>
                <SelectItem value="cs">Informatica</SelectItem>
                <SelectItem value="bus">Bedrijfskunde</SelectItem>
                <SelectItem value="eng">Techniek</SelectItem>
                <SelectItem value="arts">Kunst</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Student Groups View */}
      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid">Rasterweergave</TabsTrigger>
            <TabsTrigger value="list">Lijstweergave</TabsTrigger>
          </TabsList>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
          </div>
        </div>

        <TabsContent value="grid" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                    <div className="flex -space-x-2 mt-4">
                      {Array(4).fill(null).map((_, j) => (
                        <div key={j} className="w-8 h-8 rounded-full bg-gray-200"></div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Fout bij het laden van studentengroepen. Probeer het later opnieuw.
            </div>
          ) : studentGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Geen Studentengroepen</h3>
              <p className="mt-1 text-sm text-gray-500">
                Begin door een nieuwe studentengroep aan te maken.
              </p>
              <div className="mt-6">
                <Button onClick={handleAddStudentGroup}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Groep Aanmaken
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example card 1 */}
              <Card>
                <CardHeader>
                  <CardTitle>CS-2024-A</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-blue-100 text-blue-800 hover:bg-blue-100">Computer Science</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Studenten:</span>
                      <span className="font-medium">32</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Docent:</span>
                      <span className="font-medium">Dr. Alan Turing</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cursussen:</span>
                      <span className="font-medium">6</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>AB</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>CD</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>EF</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +28
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Example card 2 */}
              <Card>
                <CardHeader>
                  <CardTitle>BUS-2024-B</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">Business</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-medium">28</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <span className="font-medium">Prof. Adam Smith</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courses:</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>TJ</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>PK</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>ML</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +25
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Example card 3 */}
              <Card>
                <CardHeader>
                  <CardTitle>ENG-2024-A</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Engineering</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <span className="font-medium">Dr. Nikola Tesla</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courses:</span>
                      <span className="font-medium">7</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>RB</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>LM</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +21
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button 
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `Showing ${studentGroups.length} of ${totalStudentGroups} student groups`}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading student groups...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500">
                        Error loading student groups. Please try again.
                      </td>
                    </tr>
                  ) : studentGroups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No student groups found with the current filters. Try changing your search or filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS-2024-A</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Computer Science</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">32 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Dr. Alan Turing</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">BUS-2024-B</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Business</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">28 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Prof. Adam Smith</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">ENG-2024-A</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Engineering</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">24 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Dr. Nikola Tesla</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}