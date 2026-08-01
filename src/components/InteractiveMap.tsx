import { COMPANY } from "@/lib/constants";
import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractiveMapProps {
  height?: string;
  className?: string;
}

const InteractiveMap = ({ height = "h-64", className = "" }: InteractiveMapProps) => {
  // Correct coordinates for Udyam Nagar, Ratnagiri, Maharashtra
  const lat = 16.9944;
  const lng = 73.3002;
  
  // Google Maps embed URL with correct coordinates for Ratnagiri
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3820.7!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDU5JzM5LjgiTiA3M8KwMTgnMDAuNyJF!5e0!3m2!1sen!2sin!4v1!5m2!1sen!2sin`;
  
  // Google Maps search URL for directions (searches for the address)
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.address.full)}`;
  
  // Google Maps directions URL
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=ChIJoYKPKZS7wjsRwBGmrKlvYAM`;
  
  return (
    <div className={`glass rounded-2xl overflow-hidden ${className}`}>
      <div className={`relative ${height}`}>
        {/* Google Maps iframe embed */}
        <iframe
          title="Emirates Solutions Office - Ratnagiri, Maharashtra"
          src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        
        {/* Overlay with address */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{COMPANY.name}</p>
                <p className="text-xs text-muted-foreground">{COMPANY.address.full}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                asChild
              >
                <a href={googleMapsSearchUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </a>
              </Button>
              <Button
                size="sm"
                variant="default"
                className="gradient-primary"
                asChild
              >
                <a href={googleMapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
