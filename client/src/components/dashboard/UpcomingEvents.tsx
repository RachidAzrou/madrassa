import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { Event } from "@shared/schema";

interface UpcomingEventsProps {
  className?: string;
}

export default function UpcomingEvents({ className }: UpcomingEventsProps) {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
  });

  const getBorderColorClass = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "academic":
        return "border-primary";
      case "social":
        return "border-green-500";
      case "meeting":
        return "border-neutral-400";
      case "exhibition":
        return "border-amber-500";
      default:
        return "border-primary";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
          <Link href="/calendar">
            <a className="text-primary text-sm hover:underline">View Calendar</a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))
          ) : events && events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className={`flex items-start border-l-2 ${getBorderColorClass(
                  event.eventType
                )} pl-3 py-1`}
              >
                <div className="mr-3 bg-muted rounded p-2 text-center">
                  <span className="block text-sm font-semibold">
                    {format(new Date(event.startDate), "d")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {format(new Date(event.startDate), "MMM")}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.location} • {event.startTime && event.endTime
                      ? `${event.startTime.hours}:${String(event.startTime.minutes).padStart(2, "0")} - ${event.endTime.hours}:${String(event.endTime.minutes).padStart(2, "0")}`
                      : "All day"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No upcoming events</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
