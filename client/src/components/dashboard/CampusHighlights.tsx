import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CampusHighlightsProps {
  className?: string;
}

export default function CampusHighlights({ className }: CampusHighlightsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Campus Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative h-24 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="Modern campus building"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="relative h-24 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="Students studying in library"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="relative h-24 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="University classroom"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="relative h-24 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="Modern lecture hall"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
