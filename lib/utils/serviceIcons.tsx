import { 
  Wifi, 
  Tv, 
  Coffee, 
  UtensilsCrossed, 
  Waves, 
  Car, 
  Dumbbell, 
  ShoppingBag,
  Bed,
  Snowflake,
  Wind,
  Shield,
  Lock,
  Gamepad2,
  Music,
  Monitor,
  Users,
  Baby,
  Dog,
  PawPrint,
  Sparkles,
  Phone,
  Mail,
  Printer,
  Camera,
  Briefcase,
  Pill,
  Stethoscope,
  Heart,
  Plane,
  Ship,
  Train,
  Bike,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Star,
  Gift,
  Bell,
  HelpCircle,
  LucideIcon,
  ShowerHead
} from "lucide-react";

// Map service names to icons
const serviceIconMap: Record<string, LucideIcon> = {
  // Internet & Technology
  "wifi": Wifi,
  "internet": Wifi,
  "free wifi": Wifi,
  "wireless internet": Wifi,
  "tv": Tv,
  "television": Tv,
  "flat screen tv": Tv,
  "smart tv": Tv,
  "monitor": Monitor,
  "computer": Monitor,
  "phone": Phone,
  "telephone": Phone,
  "printer": Printer,
  "camera": Camera,
  
  // Food & Beverages
  "coffee": Coffee,
  "tea": Coffee,
  "breakfast": Coffee,
  "restaurant": UtensilsCrossed,
  "dining": UtensilsCrossed,
  "room service": UtensilsCrossed,
  "bar": Coffee,
  "minibar": ShoppingBag,
  
  // Spa & Wellness
  "spa": Waves,
  "massage": Waves,
  "sauna": Waves,
  "jacuzzi": Waves,
  "hot tub": Waves,
  "pool": Waves,
  "swimming pool": Waves,
  "fitness": Dumbbell,
  "gym": Dumbbell,
  "fitness center": Dumbbell,
  "workout": Dumbbell,
  
  // Transportation
  "parking": Car,
  "car": Car,
  "valet": Car,
  "airport shuttle": Plane,
  "shuttle": Plane,
  "transport": Plane,
  
  // Room Features
  "bed": Bed,
  "bedroom": Bed,
  "shower": ShowerHead,
  "bathroom": ShowerHead,
  "bathtub": ShowerHead,
  "ac": Snowflake,
  "air conditioning": Snowflake,
  "heating": Wind,
  "fan": Wind,
  "balcony": Building2,
  "terrace": Building2,
  "view": MapPin,
  
  // Safety & Security
  "safe": Lock,
  "security": Shield,
  "security box": Lock,
  "locker": Lock,
  
  // Entertainment
  "games": Gamepad2,
  "gaming": Gamepad2,
  "music": Music,
  "entertainment": Music,
  
  // Services
  "concierge": Users,
  "24/7 service": Bell,
  "front desk": Users,
  "laundry": ShoppingBag,
  "dry cleaning": ShoppingBag,
  "housekeeping": Sparkles,
  "cleaning": Sparkles,
  "towels": Sparkles,
  "linen": Sparkles,
  
  // Special
  "pet friendly": PawPrint,
  "pets allowed": PawPrint,
  "family friendly": Baby,
  "kids": Baby,
  "child": Baby,
  "business": Briefcase,
  "meeting room": Briefcase,
  "conference": Briefcase,
  
  // Health
  "medical": Stethoscope,
  "first aid": Pill,
  "doctor": Stethoscope,
  "health": Heart,
  
  // Other
  "gift shop": Gift,
  "shopping": ShoppingBag,
  "mail": Mail,
  "calendar": Calendar,
  "clock": Clock,
  "star": Star,
  "help": HelpCircle,
};

/**
 * Get icon for a service based on its name
 * Returns a Lucide icon component or null if no match found
 */
export function getServiceIcon(serviceName: string): LucideIcon | null {
  // Normalize the service name: lowercase and trim
  const normalized = serviceName.toLowerCase().trim();
  
  // Try exact match first
  if (serviceIconMap[normalized]) {
    return serviceIconMap[normalized];
  }
  
  // Try partial match (check if any key is contained in the service name)
  for (const [key, icon] of Object.entries(serviceIconMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  
  // Try word-by-word matching
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (serviceIconMap[word]) {
      return serviceIconMap[word];
    }
  }
  
  // Default fallback - return a generic icon
  return Sparkles; // Using Sparkles as a default/fallback icon
}

/**
 * Get icon component as React element with optional props
 */
export function ServiceIcon({ 
  serviceName, 
  className = "w-5 h-5",
  ...props 
}: { 
  serviceName: string; 
  className?: string;
  [key: string]: any;
}) {
  const IconComponent = getServiceIcon(serviceName);
  if (!IconComponent) return null;
  
  return <IconComponent className={className} {...props} />;
}
