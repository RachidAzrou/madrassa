import { useEffect, useState } from 'react';

interface ChartDataPoint {
  month: string;
  count: number;
}

interface EnrollmentChartProps {
  data: {
    enrollmentTrend: ChartDataPoint[];
  };
}

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  const [animated, setAnimated] = useState(false);
  const enrollmentData = data?.enrollmentTrend || [];
  
  // Calculate max value for scaling
  const maxCount = enrollmentData.length > 0 
    ? Math.max(...enrollmentData.map(item => item.count)) 
    : 100;

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">Inschrijvingstrends</h2>
        <div className="flex items-center space-x-2">
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200">Maandelijks</button>
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200 bg-gray-100">Per kwartaal</button>
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200">Jaarlijks</button>
        </div>
      </div>
      <div className="chart-container h-40 relative">
        {enrollmentData.map((item, index) => (
          <div 
            key={index} 
            className="chart-bar absolute bottom-0 w-4 bg-blue-500 rounded-t transition-all duration-700 ease-out"
            style={{
              left: `${(index / enrollmentData.length * 80) + 5}%`, 
              height: animated ? `${(item.count / maxCount) * 100}%` : '0'
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-8 text-xs text-gray-500 mt-2">
        {enrollmentData.map((item, index) => (
          <div key={index} className="text-center">{item.month}</div>
        ))}
      </div>
    </div>
  );
}
