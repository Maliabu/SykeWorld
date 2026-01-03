"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { User, Mountain } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Container from "./Container";
import Logo from '@/public/images/logo.png';

// Helper function to format money
const formatMoney = (n: number) => `UGX ${n.toFixed(2)}`;

// Component to display booking total in navbar
function BookingTotalDisplay() {
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const updateTotal = () => {
      const stored = localStorage.getItem('bookingTotalAmount');
      if (stored) {
        setTotalAmount(parseFloat(stored) || 0);
      }
    };

    // Initial load
    updateTotal();

    // Listen for custom event (when booking page updates the total)
    window.addEventListener('bookingTotalUpdated', updateTotal);
    
    // Poll for changes as backup
    const interval = setInterval(updateTotal, 300);

    return () => {
      window.removeEventListener('bookingTotalUpdated', updateTotal);
      clearInterval(interval);
    };
  }, []);

  if (totalAmount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500">/</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-600 uppercase tracking-wider text-[10px]">Total:</span>
        <span className="text-amber-600 font-bold text-sm whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
          {formatMoney(totalAmount)}
        </span>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kitchenCardClosed, setKitchenCardClosed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: session } = useSession();
  const pathname = usePathname();

  const visitImages = [
    "/images/weather.jpg",
    "/images/music.jpg",
    "/images/craft.jpg",
    "/images/pba.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % visitImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [visitImages.length]);

  const menuItems = [
    { name: "Hotel", href: "/" },
    { name: "Rooms", href: "/rooms" },
    { name: "Restaurant", href: "/kitchen" },
    { name: "Booking", href: "/booking" },
    { name: "Gallery", href: "/gallery" },
    { name: "About", href: "/about" },
  ];

  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: "Home", href: "/" }];
    
    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const href = '/' + paths.slice(0, index + 1).join('/');
        const name = path.charAt(0).toUpperCase() + path.slice(1);
        breadcrumbs.push({ name, href });
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#fafafa]">
        <Container>
          {/* Main Navbar */}
          <div className="relative flex items-center justify-between h-16 border-b border-black/10">
            {/* Left Section: MENU (with icon) + Separator + Visit Paidha */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-[#1a1c1e] transition-colors px-2 md:px-4"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <HiOutlineMenu className="w-5 h-5" />
                <span className="hidden sm:inline text-sm uppercase tracking-wide">MENU</span>
              </button>
              
              {/* Vertical Separator */}
              <div className="hidden md:block h-4 w-px bg-gray-400/50 mx-2"></div>
              
              {/* Visit Paidha Link */}
              <Link
                href="/visit"
                className="flex items-center gap-2 text-gray-600 text-sm uppercase tracking-wide hover:text-[#1a1c1e] transition-colors px-2 md:px-4"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Mountain className="w-4 h-4" />
                <span className="hidden sm:inline">Visit Paidha</span>
              </Link>
            </div>

            {/* Center: Brand Name/Logo - Absolutely positioned */}
            <Link 
              href="/" 
              className="absolute left-1/2 transform -translate-x-1/2"
            >
              {/* Logo + Text combination - Only on large screens */}
              <div className="hidden lg:flex justify-center items-center gap-2 whitespace-nowrap">
                <Image 
                  src={Logo} 
                  alt="logo" 
                  className="w-8 h-6"
                />
                <div 
                  className="text-2xl capitalize text-orange-400" 
                  style={{ 
                    fontFamily: "'Cooper Black', serif", 
                    letterSpacing: '0.01em',
                    lineHeight: '1.2'
                  }}
                >
                  Syke World
                </div>
              </div>
              {/* Fallback for smaller screens */}
              <span className="lg:hidden hidden sm:inline text-lg md:text-xl font-normal italic text-gray-600 tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                Syke World
              </span>
              <img 
                src="/images/logo.png" 
                alt="Syke World" 
                className="lg:hidden sm:hidden h-8 w-auto"
              />
            </Link>

            {/* Right Section: CONTACTS + Separator + BOOKING + Separator + Icon */}
            <div className="flex items-center">
              <Link
                href="/about"
                className="hidden md:inline text-gray-600 text-sm uppercase tracking-wide hover:text-[#1a1c1e] transition-colors px-4"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                CONTACTS
              </Link>
              
              {/* Vertical Separator */}
              <div className="hidden md:block h-4 w-px bg-gray-400/50 mx-2"></div>
              
              <Link
                href="/booking"
                className="hidden lg:inline text-gray-600 text-sm uppercase tracking-wide hover:text-[#1a1c1e] transition-colors px-4"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                BOOKING
              </Link>
              
              {/* Vertical Separator */}
              <div className="hidden lg:block h-4 w-px bg-gray-400/50 mx-2"></div>
              
              {/* User Section */}
              {session?.user ? (
                <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4">
                  <Avatar className="h-8 w-8">
                    {session.user.image && (
                      <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                    )}
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                      {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start min-w-0">
                    {session.user.name && (
                      <span className="text-xs text-[#1a1c1e] font-medium truncate max-w-[120px]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {session.user.name}
                      </span>
                    )}
                    {session.user.email && (
                      <span className="text-xs text-gray-500 truncate max-w-[120px]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {session.user.email}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <button className="text-gray-600 hover:text-[#1a1c1e] transition-colors px-2 md:px-4">
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumbs - Left aligned, matching navbar padding */}
          <div className="py-3 relative">
            <div className="flex items-center justify-between gap-2 text-xs text-gray-600 pl-4 pr-4" style={{ fontFamily: 'var(--font-inter)' }}>
              <div className="flex items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-500">/</span>}
                    <Link
                      href={crumb.href}
                      className={`hover:text-[#1a1c1e] transition-colors ${
                        index === breadcrumbs.length - 1 ? "text-[#1a1c1e]" : "text-gray-600"
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  </span>
                ))}
              </div>
              
              {/* Total Amount Display - Only on booking page */}
              {pathname === '/booking' && (
                <BookingTotalDisplay />
              )}
            </div>

            {/* Promotional Cards - Fixed positioned, overlay - Hidden on mobile */}
            <div className="hidden md:flex absolute left-8 top-full mt-2 items-center gap-4 z-50">
              {/* Paidha Card - Hidden on auth page */}
              {pathname !== '/auth' && (
              <Link 
                href="/visit"
                className="w-full max-w-[400px] group relative overflow-hidden rounded-lg p-4 backdrop-blur-md bg-black/2 border border-black/10 hover:bg-black/5 hover:border-black/20 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="flex items-center mb-2">
                    <h3 
                      className="text-sm font-semibold text-[#1a1c1e] uppercase tracking-wider ml-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Discover
                    </h3>
                  </div>
                  <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
                    {visitImages.map((img, index) => (
                      <Image
                        key={index}
                        src={img}
                        alt="Paidha"
                        fill
                        className={`absolute inset-0 object-cover transition-opacity duration-1000 ${
                          index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}
                  </div>
                  <p 
                    className="text-2xl font-bold text-[#1a1c1e] mb-1 leading-tight"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Paidha
                  </p>
                  <p 
                    className="text-xs text-gray-600 leading-relaxed mb-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    The Hidden Gem of West Nile
                  </p>
                  <div className="flex items-center justify-end">
                    <svg className="w-4 h-4 text-black/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
              )}

              {/* Bar & Restaurant Card */}
              {!kitchenCardClosed && (
                <div className="w-full max-w-[400px] group relative overflow-hidden rounded-lg p-4 backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <Link href="/kitchen" className="relative z-10 block">
                    <div className="flex items-center mb-2">
                      <h3 
                        className="text-sm font-semibold text-[#1a1c1e] uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Experience
                      </h3>
                    </div>
                    <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
                      <Image
                        src="/images/pexels-creative-vix-370984.jpg"
                        alt="Bar & Restaurant"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p 
                      className="text-2xl font-bold text-[#1a1c1e] mb-1 leading-tight"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Bar & Restaurant
                    </p>
                    <p 
                      className="text-xs text-gray-600 leading-relaxed mb-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Exquisite cuisine & crafted cocktails
                    </p>
                    <div className="flex items-center justify-end">
                      <svg className="w-4 h-4 text-black/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                  {/* Close Button - Only visible on hover */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setKitchenCardClosed(true);
                    }}
                    className="absolute top-2 right-2 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </nav>

      {/* Sidebar Menu */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 bg-white border-r border-gray-300 p-0">
          <SheetHeader className="p-6 border-b border-gray-300">
            <SheetTitle className="text-[#1a1c1e] text-xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Syke World
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1 px-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-3 text-sm uppercase tracking-wide transition-colors rounded ${
                  pathname === item.href
                    ? "text-[#1a1c1e] bg-gray-200"
                    : "text-gray-600 hover:text-[#1a1c1e] hover:bg-gray-100"
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-300">
              {!session ? (
                <Link
                  href="/auth"
                  onClick={() => setSidebarOpen(false)}
                  className="block px-4 py-3 text-sm uppercase tracking-wide text-gray-600 hover:text-[#1a1c1e] transition-colors rounded"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Sign In
                </Link>
              ) : (
                <>
                  {/* Profile Section */}
                  <div className="px-4 py-4 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {session.user?.image && (
                          <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                        )}
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                          {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {session.user?.name && (
                          <p className="text-sm font-medium text-[#1a1c1e] truncate" style={{ fontFamily: 'var(--font-inter)' }}>
                            {session.user.name}
                          </p>
                        )}
                        {session.user?.email && (
                          <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setSidebarOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm uppercase tracking-wide text-gray-600 hover:text-[#1a1c1e] transition-colors rounded"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
