import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, getDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import EventForm from "./EventForm";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<Event[]>([]);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  useEffect(() => {
    if (events) {
      const filteredEvents = events.filter(event => {
        const eventDate = parseISO(event.startDate.toString());
        return isSameDay(eventDate, selectedDate);
      });
      setEventsForSelectedDate(filteredEvents);
    }
  }, [selectedDate, events]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = parseISO(event.startDate.toString());
      return isSameDay(eventDate, day);
    });
  };

  const getEventTypeBorder = (eventType: string) => {
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

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-1 bg-muted/20 py-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateFormat = "d";
    const rows = [];

    let days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    // Add days from previous month to start from Sunday
    const firstDayOfMonth = getDay(monthStart);
    const prevMonthDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDate = new Date(monthStart);
      prevDate.setDate(prevDate.getDate() - (firstDayOfMonth - i));
      prevMonthDays.push(prevDate);
    }

    // Add days from next month to end on Saturday
    const lastDayOfMonth = getDay(monthEnd);
    const nextMonthDays = [];
    for (let i = 1; i < 7 - lastDayOfMonth; i++) {
      const nextDate = new Date(monthEnd);
      nextDate.setDate(nextDate.getDate() + i);
      nextMonthDays.push(nextDate);
    }

    // Combine all days
    const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

    // Chunk the days into weeks
    const rows_count = Math.ceil(allDays.length / 7);
    for (let i = 0; i < rows_count; i++) {
      rows.push(allDays.slice(i * 7, (i + 1) * 7));
    }

    return (
      <div className="mt-1">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-1">
            {row.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isSelectedDay = isSameDay(day, selectedDate);
              
              return (
                <div
                  key={idx}
                  className={cn(
                    "border min-h-24 rounded-md p-1 transition-colors",
                    isToday(day)
                      ? "bg-muted/50 font-semibold"
                      : isSameMonth(day, currentMonth)
                      ? "bg-background"
                      : "bg-muted/10 text-muted-foreground",
                    isSelectedDay && "ring-2 ring-primary"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div className="text-right mb-1">
                    <div className={cn(
                      "inline-block rounded-full w-6 h-6 text-center leading-6 text-sm",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, dateFormat)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {isLoading ? (
                      <Skeleton className="h-5 w-full" />
                    ) : (
                      dayEvents.slice(0, 2).map((event, eventIdx) => (
                        <div
                          key={eventIdx}
                          className={cn(
                            "text-xs p-1 truncate rounded-sm border-l-2",
                            getEventTypeBorder(event.eventType)
                          )}
                        >
                          {event.title}
                        </div>
                      ))
                    )}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        + {dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Academic Calendar</h1>
      </div>

      {showEventForm ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Event</h2>
              <Button variant="outline" onClick={() => setShowEventForm(false)}>
                Cancel
              </Button>
            </div>
            <EventForm 
              initialDate={selectedDate}
              onSuccess={() => setShowEventForm(false)} 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="py-4 px-6">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Events for {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))
                ) : eventsForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events scheduled for this date
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventsForSelectedDate.map((event) => (
                      <div key={event.id} className="border-l-2 pl-3 py-1" 
                         style={{ borderColor: `var(--${getEventTypeBorder(event.eventType).replace('border-', '')})` }}>
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <span className="mr-2">
                            {event.startTime && event.endTime
                              ? `${event.startTime.hours}:${String(event.startTime.minutes).padStart(2, "0")} - ${event.endTime.hours}:${String(event.endTime.minutes).padStart(2, "0")}`
                              : "All day"}
                          </span>
                          {event.location && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
