export interface RoomService {
  id: number;
  name: string;
  icon?: string;
  description:string;
}

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  maxGuests: number;
  services: RoomService[];
}

export interface RoomImage {
  id: number;
  image: string;
  caption?: string;
}


export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  status: string;
  roomType: RoomType; // note camelCase
  images: RoomImage[];
  services?: RoomService[];
  reviews?: Review[];
}


export interface CarouselProps {
  images: string[];
}

export interface Review {
  id: string;
  user: string;
  message: string;
  stars: number;
  avatar?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  userType: "guest" | "staff" | "admin"; // from enum
  phone: string | null;
  gender: "male" | "female" | null;
  address: string | null;
  profilePicture: string | null;
  birthDate: string | null;
  isVerified: boolean;
  isDisabled: boolean;
  isActive: boolean;
  isStaff: boolean;
  isLoggedIn: boolean;
  isSuperuser: boolean;
  dateJoined: Date;
  lastLogin: Date | null;
  created: Date;
};
