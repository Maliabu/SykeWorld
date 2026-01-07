"use client";

import { useState } from "react";
import Container from "./Container";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { FaChevronCircleRight, FaFacebook, FaInstagram, FaSpa } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { subscribe } from "@/lib/actions/bookings";
import Logo from '@/public/images/logo.png';

// Zod schema for validation
const subscribeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export default function Footer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate
    const result = subscribeSchema.safeParse({ name, email });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const subscribeResult = await subscribe({ name, email });

      if (subscribeResult.error) {
        toast.error(subscribeResult.error);
        return;
      }

      toast.success("Subscribed successfully!");
      setName("");
      setEmail("");
    } catch (err) {
      toast.error("Subscription failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full bg-[#fafafa] text-[#1a1c1e] relative border-t border-black/10">
      <Container>
        {/* Subscribe Section */}
        <div className="py-16 md:py-24 border-b border-black/10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Newsletter
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Stay Connected
            </h2>
            <p 
              className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Don't miss out on what's new! Keep in the loop with our latest updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 bg-transparent border border-black/20 text-[#1a1c1e] placeholder-gray-500 px-4 py-3 rounded focus:outline-none focus:border-amber-600 transition-all"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="flex-1 bg-transparent border border-black/20 text-[#1a1c1e] placeholder-gray-500 px-4 py-3 rounded focus:outline-none focus:border-amber-600 transition-all"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 font-medium tracking-wide uppercase transition-all duration-300 whitespace-nowrap"
                  disabled={loading}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
            </div>
          </form>
        </div>

        {/* Footer Content */}
        <div className="py-16 md:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <Link href="/" className="flex flex-col items-center mb-6">
                <div className="flex flex-col items-center gap-2 whitespace-nowrap">
                  <Image 
                    src={Logo} 
                    alt="logo" 
                    className="w-10 h-8"
                  />
                  <div 
                    className="text-2xl capitalize text-[#1a1c1e]" 
                    style={{ 
                      fontFamily: "'Cooper Black', serif", 
                      letterSpacing: '0.01em',
                      lineHeight: '1.2'
                    }}
                  >
                    Syke World
                  </div>
                </div>
              </Link>
              <p 
                className="text-sm text-gray-600 leading-relaxed text-center"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Luxury meets serenity. Experience comfort like never before.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 
                className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium mb-6"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Navigation
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/gallery" className="text-gray-600 hover:text-[#1a1c1e] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/roomservice" className="text-gray-600 hover:text-[#1a1c1e] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/kitchen" className="text-gray-600 hover:text-[#1a1c1e] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    Bar & Restaurant
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-[#1a1c1e] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 
                className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium mb-6"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Contact
              </h4>
              <div className="space-y-4 text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                <div>
                  <p className="text-[#1a1c1e] font-medium mb-1">Location</p>
                  <p>Syk Jad International Limited</p>
                  <p>Arua Road</p>
                  <p>West Nile, Paidha, +256</p>
                  <p>Uganda</p>
                </div>
                <div>
                  <p className="text-[#1a1c1e] font-medium mb-1">Phone</p>
                  <p>+256 782-360252</p>
                  <p>+256 760-633312</p>
                </div>
                <div>
                  <p className="text-[#1a1c1e] font-medium mb-1">Email</p>
                  <p>info@sykeworld.com</p>
                </div>
              </div>
            </div>

            {/* Visit Cards */}
            <div>
              {/* Paidha Card */}
              <Link 
                href="/visit"
                className="block mb-4 group relative overflow-hidden rounded-lg p-4 backdrop-blur-md bg-black/2 border border-black/10 hover:bg-black/5 hover:border-black/20 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="flex items-center mb-2">
                    <h3 
                      className="text-sm font-semibold text-[#1a1c1e] uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Discover
                    </h3>
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
                    <svg className="w-4 h-4 text-black/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Kitchen Card */}
              <Link 
                href="/kitchen"
                className="block group relative overflow-hidden rounded-lg p-4 backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="flex items-center mb-2">
                    <h3 
                      className="text-sm font-semibold text-[#1a1c1e] uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Experience
                    </h3>
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
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Social Icons */}
        <div className="py-6 border-t border-black/10">
          <div className="flex justify-center space-x-6">
            <Link href="#" className="text-gray-600 hover:text-[#1a1c1e] transition-colors">
              <FaFacebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-[#1a1c1e] transition-colors">
              <FaX className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-[#1a1c1e] transition-colors">
              <FaInstagram className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-black/10">
          <div className="text-center text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
            © {new Date().getFullYear()} Syke World Hotel. All rights reserved.
          </div>
        </div>
      </Container>
      <Toaster />
    </footer>
  );
}
