import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch courses with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/courses', { searchTerm, department, page: currentPage }],
    staleTime: 30000,
  });

  const courses = data?.courses || [];
  const totalCourses = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCourses / 10); // Assuming 10 courses per page

  const handleAddCourse = async () => {
    // Implementation will be added for course creation
    console.log('Add course clicked');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Campus afbeelding met collegezaal */}
      <div className="relative rounded-xl overflow-hidden h-48 md:h-64">
        <img 
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
          alt="Universiteitslokaal" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-gray-900/30 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Cursusbeheer</h1>
            <p className="text-gray-200 max-w-xl">Beheer de cursuscatalogus, inschrijvingen en roosters van uw instelling op één plek.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoek cursussen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Select value={department} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle Afdelingen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Afdelingen</SelectItem>
              <SelectItem value="cs">Informatica</SelectItem>
              <SelectItem value="bus">Bedrijfskunde</SelectItem>
              <SelectItem value="eng">Techniek</SelectItem>
              <SelectItem value="arts">Kunst</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddCourse} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Nieuwe Cursus Toevoegen</span>
        </Button>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="col-span-full text-center py-8 text-red-500">
            Fout bij het laden van cursussen. Probeer het opnieuw.
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Geen cursussen gevonden. Pas uw filters aan.
          </div>
        ) : (
          courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{course.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{course.courseCode} • {course.credits} Studiepunten</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded">{course.department}</span>
                </div>
                <p className="mt-3 text-gray-600 text-sm">{course.description}</p>
                <div className="mt-4 flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {course.instructor.firstName.charAt(0)}{course.instructor.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-800">{course.instructor.title} {course.instructor.firstName} {course.instructor.lastName}</p>
                    <p className="text-xs text-gray-500">{course.instructor.position}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex items-center text-gray-500 text-xs">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>{course.enrolledStudents} studenten ingeschreven</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-primary hover:text-primary-dark text-sm">Bewerken</button>
                    <button className="text-gray-500 hover:text-gray-700 text-sm">Bekijken</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 0 && (
        <div className="flex items-center justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Vorige</span>
              &larr;
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Volgende</span>
              &rarr;
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
