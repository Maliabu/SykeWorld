export interface RoomService {
  id: number;
  name: string;
  icon?: string;
}

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  max_guests: number;
  services: RoomService[];
}

export interface RoomImage {
  id: number;
  image: string;
  caption?: string;
}

export interface Room {
  id: number;
  room_number: string;
  floor: number;
  status: string;
  room_type: RoomType;
  images: string[];
  price: string;
  priceValue: number;
  services: RoomService[];
  reviews: { stars: number; count: number };
}

export interface CarouselProps {
  images: string[];
}

export interface Review {
  id: number;
  user: string;
  message: string;
  stars: number;
  avatar?: string;
}