import { useQuery } from '@tanstack/react-query';

// Component voor de studenten per klas grafiek
export default function StudentGroupsChart() {
  // Fetch student groups data
  const { data: studentGroupsData = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });
  
  // Fetch group enrollments
  const { data: groupEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/student-group-enrollments'],
    staleTime: 60000,
  });
  
  // Interface for student group
  interface StudentGroup {
    id: number;
    name: string;
    maxCapacity?: number;
  }
  
  // Interface for student group enrollments
  interface StudentGroupEnrollment {
    id: number;
    studentId: number;
    studentGroupId: number;
  }
  
  // Calculate student counts per group and track max capacity
  const studentCountsPerGroup = (studentGroupsData as StudentGroup[]).map((group) => {
    const count = (groupEnrollments as StudentGroupEnrollment[]).filter(
      enrollment => enrollment.studentGroupId === group.id
    ).length;
    
    return {
      name: group.name,
      count: count,
      maxCapacity: group.maxCapacity || 25, // Default to 25 if no maxCapacity
      percentageFilled: count / (group.maxCapacity || 25) // Calculate fill percentage
    };
  });
  
  // Add default data if no real data exists
  const chartData = studentCountsPerGroup.length > 0 ? studentCountsPerGroup : [
    { name: "Klas 1", count: 0, maxCapacity: 25, percentageFilled: 0 },
    { name: "Klas 2", count: 0, maxCapacity: 25, percentageFilled: 0 },
    { name: "Klas 3", count: 0, maxCapacity: 25, percentageFilled: 0 }
  ];

  if (isGroupsLoading || isEnrollmentsLoading) {
    return (
      <div className="h-32 sm:h-48 flex items-center justify-center">
        <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-32 sm:h-48 flex items-center justify-center text-gray-500 text-sm">
        Geen klasgegevens beschikbaar
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
      {chartData.map((item, index) => {
        // Calculate styling classes based on fill percentage
        const borderColorClass = item.percentageFilled < 0.5 
          ? 'border-green-400' 
          : item.percentageFilled < 0.75 
            ? 'border-amber-400' 
            : 'border-red-400';
            
        const textColorClass = item.percentageFilled < 0.5 
          ? 'text-green-600' 
          : item.percentageFilled < 0.75 
            ? 'text-amber-600' 
            : 'text-red-600';
            
        const progressBgClass = item.percentageFilled < 0.5 
          ? 'bg-green-400' 
          : item.percentageFilled < 0.75 
            ? 'bg-amber-400' 
            : 'bg-red-400';
            
        return (
          <div 
            key={index} 
            className={`rounded-lg border-2 ${borderColorClass} bg-white p-4 shadow-sm transition-all hover:shadow-md`}
          >
            <h4 className="font-medium text-gray-700 mb-2">{item.name}</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Bezetting</span>
              <span className={`text-sm font-bold ${textColorClass}`}>{item.count} / {item.maxCapacity}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${progressBgClass} transition-all duration-1000 ease-out`}
                style={{width: `${Math.min(100, item.percentageFilled * 100)}%`}}
              />
            </div>
            
            {/* Percentage */}
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">
                {Math.round(item.percentageFilled * 100)}% vol
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}