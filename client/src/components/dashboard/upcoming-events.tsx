import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format, isFuture, addMonths } from "date-fns";

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  isAllDay: boolean;
}

export default function UpcomingEvents() {
  // Get events for the next month
  const startDate = new Date();
  const endDate = addMonths(startDate, 1);
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/events?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    }
  });

  // Sort events by date and filter only future events
  const upcomingEvents = events
    .filter((event: Event) => isFuture(new Date(event.startDate)))
    .sort((a: Event, b: Event) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 4); // Get first 4 events

  // Get color classes based on event type
  const getEventTypeClass = (type: string): string => {
    switch (type) {
      case "academic":
        return "border-primary";
      case "exam":
        return "border-red-500";
      case "holiday":
        return "border-green-500";
      case "meeting":
        return "border-purple-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link href="/calendar">View Calendar</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming events. Add events from the calendar.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {upcomingEvents.map((event: Event) => (
              <li key={event.id} className={`py-3 flex border-l-2 pl-3 ${getEventTypeClass(event.type)}`}>
                <div className="flex-shrink-0 w-12 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(event.startDate), "MMM")}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {format(new Date(event.startDate), "d")}
                  </p>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.isAllDay 
                      ? "All day" 
                      : `${format(new Date(event.startDate), "h:mm a")}`}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
