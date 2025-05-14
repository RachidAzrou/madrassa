import { CalendarIcon } from 'lucide-react';

export interface Event {
  id: string;
  title: string;
  date: {
    day: number;
    month: string;
  };
  location: string;
  time: string;
  type: 'primary' | 'warning' | 'neutral' | 'success';
}

interface EventListProps {
  events: Event[];
  onViewCalendar?: () => void;
}

export function EventList({ events, onViewCalendar }: EventListProps) {
  // Map event type to border color
  const getBorderColor = (type: Event['type']) => {
    switch (type) {
      case 'primary': return 'border-primary';
      case 'warning': return 'border-yellow-500';
      case 'success': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Upcoming Events</h2>
        <button 
          onClick={onViewCalendar}
          className="text-primary text-sm hover:underline flex items-center"
        >
          <CalendarIcon className="mr-1 h-4 w-4" />
          View Calendar
        </button>
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <div 
            key={event.id} 
            className={`flex items-start border-l-2 ${getBorderColor(event.type)} pl-3 py-1`}
          >
            <div className="mr-3 bg-gray-100 rounded p-2 text-center">
              <span className="block text-sm font-semibold text-gray-800">{event.date.day}</span>
              <span className="block text-xs text-gray-500">{event.date.month}</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{event.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{event.location} • {event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
