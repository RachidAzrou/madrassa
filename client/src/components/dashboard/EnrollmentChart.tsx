import { useEffect, useState } from 'react';

interface ChartDataPoint {
  month: string;
  value: number;
}

interface EnrollmentChartProps {
  data: ChartDataPoint[];
}

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  const [animated, setAnimated] = useState(false);

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
        <h2 className="font-semibold text-gray-800">Enrollment Trends</h2>
        <div className="flex items-center space-x-2">
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200">Monthly</button>
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200 bg-gray-100">Quarterly</button>
          <button className="text-xs text-gray-600 hover:text-primary px-2 py-1 rounded border border-gray-200">Yearly</button>
        </div>
      </div>
      <div className="chart-container relative">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="chart-bar" 
            style={{
              left: `${(index / data.length * 80) + 5}%`, 
              height: animated ? `${item.value}%` : '0'
            }}
          />
        ))}
      </div>
      <div className={`grid grid-cols-${data.length} text-xs text-gray-500 mt-2`}>
        {data.map((item, index) => (
          <div key={index} className="text-center">{item.month}</div>
        ))}
      </div>
    </div>
  );
}
