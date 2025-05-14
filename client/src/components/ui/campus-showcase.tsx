import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CampusShowcase = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Our Campus</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {/* Modern university building image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Modern university building" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Main Campus</span>
            </div>
          </div>
          
          {/* University library image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="University library" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Library</span>
            </div>
          </div>
          
          {/* Campus quad image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Campus quad" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Quad Area</span>
            </div>
          </div>
          
          {/* Lecture hall image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Modern lecture hall" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-end p-3">
              <span className="text-white text-sm font-medium">Lecture Hall</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampusShowcase;
