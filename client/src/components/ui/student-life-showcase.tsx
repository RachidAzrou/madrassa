import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentLifeShowcase() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Student Life</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {/* Group of diverse students studying together in a library */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Students studying together" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Collaborative Learning</span>
            </div>
          </div>
          
          {/* Students collaborating on a project in a classroom setting */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://pixabay.com/get/g5ce301cea77c986decbe6332e3e27b75a70717da74d0bf7c4bfe2ec8dbb3dbd496461b8b2ab7f06b0624f2fe10a4e01a485f2136242a2b6dac2359ccb793d32c_1280.jpg" 
              alt="Students collaborating" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Project Work</span>
            </div>
          </div>
          
          {/* Student using a laptop in an outdoor campus setting */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Student studying outdoors" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Outdoor Learning</span>
            </div>
          </div>
          
          {/* Group of students in graduation gowns celebrating */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Graduation celebration" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Graduation Day</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
