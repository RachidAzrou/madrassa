import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { format as formatDate } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "",
    endTime: "",
    location: "",
    eventType: "academic",
  });

  // Fetch events data
  const {
    data: events = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "/api/events/range",
      {
        start: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const response = await fetch(`/api/events/range?start=${params.start}&end=${params.end}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/range"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      setIsEventFormOpen(false);
      resetEventForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/range"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setIsEventFormOpen(false);
      resetEventForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEvent = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/range"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      setShowEventDetails(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetEventForm = () => {
    setEventData({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "",
      endTime: "",
      location: "",
      eventType: "academic",
    });
    setSelectedEvent(null);
  };

  const handleAddEvent = (date?: Date) => {
    resetEventForm();
    if (date) {
      setEventData(prev => ({
        ...prev,
        startDate: date,
        endDate: date,
      }));
    }
    setIsEventFormOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEventData({
      title: event.title || "",
      description: event.description || "",
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      eventType: event.eventType || "academic",
    });
    setShowEventDetails(false);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent && window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent.mutate(selectedEvent.id);
    }
  };

  const handleEventFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventPayload = {
      ...eventData,
      startDate: format(eventData.startDate, "yyyy-MM-dd"),
      endDate: format(eventData.endDate, "yyyy-MM-dd"),
    };

    if (selectedEvent) {
      updateEvent.mutate({ id: selectedEvent.id, data: eventPayload });
    } else {
      createEvent.mutate(eventPayload);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: "startDate" | "endDate", date: Date | undefined) => {
    if (date) {
      setEventData(prev => ({ ...prev, [field]: date }));
    }
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Calendar days generation
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    events.forEach((event: any) => {
      const dateKey = format(new Date(event.startDate), "yyyy-MM-dd");
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }, [events]);

  // Get background color based on event type
  const getEventColor = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-primary";
      case "holiday":
        return "bg-green-500";
      case "exam":
        return "bg-red-500";
      case "meeting":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Error loading calendar events: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Calendar"
        description="Plan and manage academic events and schedules"
        action={{
          label: "Add Event",
          onClick: () => handleAddEvent(),
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <div className="flex items-center space-x-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week" disabled>Week</SelectItem>
                  <SelectItem value="day" disabled>Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="h-10 flex items-center justify-center font-medium text-sm">
                {dayName}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              
              return (
                <div
                  key={day.toString()}
                  onClick={() => handleAddEvent(day)}
                  className={cn(
                    "min-h-[120px] p-1 border border-gray-100 overflow-hidden",
                    "hover:bg-gray-50 cursor-pointer transition-colors",
                    isToday(day) && "bg-primary-50 border-primary-200",
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday(day) && "bg-primary text-white"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      dayEvents.slice(0, 3).map((event: any) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEvent(event);
                          }}
                          className={cn(
                            "px-2 py-1 text-xs rounded-sm text-white truncate",
                            getEventColor(event.eventType)
                          )}
                        >
                          {event.title}
                        </div>
                      ))
                    )}
                    
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        + {dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Form Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent
                ? "Update event information"
                : "Enter the details for the new event"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEventFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                placeholder="Add event description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventData.startDate ? format(eventData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={eventData.startDate}
                      onSelect={(date) => handleDateChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventData.endDate ? format(eventData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={eventData.endDate}
                      onSelect={(date) => handleDateChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={eventData.startTime}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={eventData.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={eventData.location}
                onChange={handleInputChange}
                placeholder="Event location"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select 
                value={eventData.eventType} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, eventType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setIsEventFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                {createEvent.isPending || updateEvent.isPending
                  ? "Saving..."
                  : selectedEvent
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEvent?.description && (
              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedEvent && formatDate(new Date(selectedEvent.startDate), "PPP")}
                  {selectedEvent && selectedEvent.startDate !== selectedEvent.endDate && 
                    ` - ${formatDate(new Date(selectedEvent.endDate), "PPP")}`}
                </span>
              </div>
              
              {selectedEvent && selectedEvent.startTime && (
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-muted-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>
                    {selectedEvent.startTime}
                    {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                  </span>
                </div>
              )}
              
              {selectedEvent?.location && (
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-muted-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-muted-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                </svg>
                <span className="capitalize">{selectedEvent?.eventType || "Academic"} Event</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => handleEditEvent(selectedEvent)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteEvent}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
