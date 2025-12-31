"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingForm from "../(forms)/BookingForm";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa]">
      <div className="w-full py-20 md:py-32 relative z-10">
        <div className="w-full">
          {/* Text Content Above Image */}
          <div className="text-center mb-16 space-y-6">
            {/* Elegant Subheading */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-16 bg-black/20"></div>
              <p className="text-sm uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Luxury Resort Experience
              </p>
              <div className="h-px w-16 bg-black/20"></div>
            </div>

            {/* Main Heading with elegant typography */}
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1a1c1e] leading-[1.1] tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Welcome to<br />
              <span className="text-[#1a1c1e]">Syke World</span>
            </h1>
            
            {/* Description Text */}
            <p 
              className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Where luxury meets serenity. Experience unparalleled comfort and exceptional service in the heart of elegance. Your perfect escape awaits.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-sm font-medium tracking-wide uppercase transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Book Your Stay
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center bg-transparent text-[#1a1c1e] px-8 py-4 text-sm font-medium tracking-wide uppercase border-2 border-black/30 hover:border-black hover:bg-black/5 transition-all duration-300"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Explore Rooms
              </Link>
            </div>
          </div>

          {/* Hero Image Below Text */}
          <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px]">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src="/images/syke.png"
                alt="Syke World Hotel"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent"></div>
            </div>
            
            {/* Booking Form Overlay - Responsive positioning */}
            {/* Small/Medium: Centered blur card with half overlapping */}
            <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-full max-w-md px-4 md:block lg:hidden">
              <div className="backdrop-blur-md bg-black/2 border-l border-r border-black/10">
                <BookingForm />
              </div>
            </div>
            
            {/* Large: Overlay on top of image, taller than image, respects padding */}
            <div className="hidden lg:flex absolute -top-[82px] -bottom-[82px] right-0 w-full px-4 lg:px-16 justify-end items-stretch">
              <div className="bg-[#fafafa] w-full max-w-[350px] border-l border-r border-black/10 flex items-center justify-center">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
