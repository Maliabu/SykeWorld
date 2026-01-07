
import { Separator } from "@radix-ui/react-separator";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface FeatureCardProps {
  icon?: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-lg text-center p-10 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.12] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/bg.jpeg)' }}
      />
      <div className="relative z-10 w-full">
      {icon ? (
        <img src={icon} alt={title} height={50} width={50} className="mb-8" />
      ) : (
        <Avatar className="h-12 w-12 mb-8 bg-amber-600">
          <AvatarFallback className="text-white font-semibold text-lg">
            {getInitials(title)}
          </AvatarFallback>
        </Avatar>
      )}
      <h3 
        className="font-semibold text-lg text-stone-900"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {title}
      </h3>
      <p 
        className="mt-2 text-sm line-clamp-3 text-stone-600"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {description}
      </p>
      </div>
    </div>
  );
}
