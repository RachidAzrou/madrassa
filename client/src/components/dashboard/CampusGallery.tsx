import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CampusGalleryProps {
  title: string;
  description?: string;
}

const CampusGallery: React.FC<CampusGalleryProps> = ({ 
  title,
  description
}) => {
  // Sample campus images - in a real app these would be from API
  const campusImages = [
    {
      url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Modern university building"
    },
    {
      url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "University library"
    },
    {
      url: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Campus quad"
    },
    {
      url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Modern lecture hall"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {campusImages.map((image, index) => (
            <div 
              key={index}
              className="rounded-lg overflow-hidden h-36 md:h-48"
            >
              <img 
                src={image.url} 
                alt={image.alt} 
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampusGallery;
