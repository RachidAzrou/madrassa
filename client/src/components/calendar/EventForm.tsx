import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { eventFormSchema } from "@shared/schema";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EventFormProps {
  eventId?: number;
  initialDate?: Date;
  onSuccess?: () => void;
}

export default function EventForm({ eventId, initialDate, onSuccess }: EventFormProps) {
  const { toast } = useToast();
  const isEditMode = !!eventId;

  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: isEditMode,
  });

  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: initialDate || new Date(),
      endDate: initialDate || new Date(),
      startTime: undefined,
      endTime: undefined,
      location: "",
      eventType: "academic",
      programId: undefined,
      courseId: undefined,
      isAllDay: false,
    },
  });

  // Set form values when editing
  React.useEffect(() => {
    if (isEditMode && eventData) {
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      
      form.reset({
        title: eventData.title,
        description: eventData.description || "",
        startDate,
        endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location || "",
        eventType: eventData.eventType,
        programId: eventData.programId,
        courseId: eventData.courseId,
        isAllDay: !eventData.startTime && !eventData.endTime,
      });
    }
  }, [isEditMode, eventData, form]);

  const createEvent = useMutation({
    mutationFn: async (data: any) => {
      // Remove isAllDay field before sending to API
      const { isAllDay, ...submitData } = data;
      
      // If isAllDay is true, set startTime and endTime to null
      if (isAllDay) {
        submitData.startTime = null;
        submitData.endTime = null;
      }
      
      const response = await apiRequest("POST", "/api/events", submitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (data: any) => {
      // Remove isAllDay field before sending to API
      const { isAllDay, ...submitData } = data;
      
      // If isAllDay is true, set startTime and endTime to null
      if (isAllDay) {
        submitData.startTime = null;
        submitData.endTime = null;
      }
      
      const response = await apiRequest("PUT", `/api/events/${eventId}`, submitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (isEditMode) {
      updateEvent.mutate(data);
    } else {
      createEvent.mutate(data);
    }
  };

  if (isEditMode && isLoadingEvent) {
    return <div>Loading event data...</div>;
  }

  const isAllDay = form.watch("isAllDay");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">All day event</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAllDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <div className="flex">
                    <Select
                      value={field.value ? String(field.value.hours) : ""}
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        const minutes = field.value?.minutes || 0;
                        field.onChange({ hours, minutes });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Hours" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2 self-center">:</span>
                    <Select
                      value={field.value ? String(field.value.minutes) : ""}
                      onValueChange={(value) => {
                        const hours = field.value?.hours || 0;
                        const minutes = parseInt(value);
                        field.onChange({ hours, minutes });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Minutes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={String(minute)}>
                            {String(minute).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <div className="flex">
                    <Select
                      value={field.value ? String(field.value.hours) : ""}
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        const minutes = field.value?.minutes || 0;
                        field.onChange({ hours, minutes });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Hours" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2 self-center">:</span>
                    <Select
                      value={field.value ? String(field.value.minutes) : ""}
                      onValueChange={(value) => {
                        const hours = field.value?.hours || 0;
                        const minutes = parseInt(value);
                        field.onChange({ hours, minutes });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Minutes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={String(minute)}>
                            {String(minute).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter event location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="programId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Program (Optional)</FormLabel>
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => {
                    field.onChange(value ? parseInt(value) : undefined);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Course (Optional)</FormLabel>
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => {
                    field.onChange(value ? parseInt(value) : undefined);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onSuccess && (
            <Button variant="outline" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createEvent.isPending || updateEvent.isPending}
          >
            {createEvent.isPending || updateEvent.isPending ? (
              "Saving..."
            ) : isEditMode ? (
              "Update Event"
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
