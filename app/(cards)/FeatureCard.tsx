

import { Separator } from "@radix-ui/react-separator";
import Image from "next/image";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

export default function FeatureCard({ icon, title, description, image }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center bg-white rounded-lg text-center p-15">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      {/* <Image src={image} alt={title} height={300} width={300} className="my-8 rounded-2xl" /> */}
      {/* <Separator className="w-full h-px my-8 bg-gray-600" orientation="horizontal" />
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p> */}

    </div>
  );
}
