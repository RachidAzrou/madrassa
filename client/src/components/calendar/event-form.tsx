import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { insertEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Extend the schema to add client-side validation
const eventFormSchema = insertEventSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().optional(),
  startDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }
);

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isEdit?: boolean;
  selectedDate?: Date;
}

export default function EventForm({ 
  isOpen, 
  onClose, 
  initialData, 
  isEdit = false,
  selectedDate
}: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay || false);

  // Format dates for the form
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  };

  // Setup form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: formatDateForInput(initialData.startDate),
      endDate: formatDateForInput(initialData.endDate),
    } : {
      title: "",
      description: "",
      startDate: formatDateForInput(selectedDate || new Date()),
      endDate: formatDateForInput(selectedDate ? new Date(selectedDate.setHours(selectedDate.getHours() + 1)) : new Date(new Date().setHours(new Date().getHours() + 1))),
      location: "",
      type: "academic",
      isAllDay: false,
    },
  });

  // Watch form values
  const watchIsAllDay = form.watch("isAllDay");

  // Handle all-day event toggle
  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
    form.setValue("isAllDay", checked);
    
    if (checked) {
      // If all-day is checked, set times to start and end of day
      const startDate = new Date(form.getValues("startDate"));
      const endDate = new Date(form.getValues("endDate"));
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      form.setValue("startDate", formatDateForInput(startDate));
      form.setValue("endDate", formatDateForInput(endDate));
    }
  };

  // Create or update event mutation
  const mutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      if (isEdit && initialData?.id) {
        return apiRequest("PUT", `/api/events/${initialData.id}`, values);
      } else {
        return apiRequest("POST", "/api/events", values);
      }
    },
    onSuccess: async () => {
      // Invalidate the events query to refresh the calendar
      await queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: `Event ${isEdit ? "updated" : "created"} successfully`,
        variant: "default",
      });
      
      // Close the dialog and reset form
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEdit ? "update" : "create"} event`,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: EventFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fall Semester Orientation" {...field} />
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
                      placeholder="Brief description of the event" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        handleAllDayChange(checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>All-day event</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start {isAllDay ? "Date" : "Date & Time"}</FormLabel>
                    <FormControl>
                      <Input 
                        type={isAllDay ? "date" : "datetime-local"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End {isAllDay ? "Date" : "Date & Time"}</FormLabel>
                    <FormControl>
                      <Input 
                        type={isAllDay ? "date" : "datetime-local"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Hall, Room 101, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update" : "Create"} Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
