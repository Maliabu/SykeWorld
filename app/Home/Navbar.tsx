"use client";

import { useState } from "react";
import Link from "next/link";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Container from "./Container";
import { FaFacebook, FaInstagram, FaPlus, FaSpa } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FaX } from "react-icons/fa6";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // control desktop sheet
  const { data: session } = useSession();
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "Rooms", href: "/rooms" },
    { name: "Bar & Restaurant", href: "/kitchen" },
    { name: "Gallery", href: "/gallery" },
    { name: "Services", href: "/roomservice" },
    { name: "Menu", href: "/kitchen" },
    { name: "About", href: "/about" },
    { name: "Contact Us", href: "/about" },
  ];

  const firstFew = menuItems.filter((_, i) => i < 4);
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="relative z-10 bg-stone-200">
      <div className=" bg-stone-300 text-stone-950 p-2">
        <Container>
          <div className="flex space-x-4">
              <Link href="#" className="hover:text-primary">
                <FaFacebook className="h-3 w-3" />
              </Link>
              <Link href="#" className="hover:text-primary">
                <FaX className="h-3 w-3" />
              </Link>
              <Link href="#" className="hover:text-primary">
                <FaInstagram className="h-3 w-3" />
              </Link>
            </div>
        </Container>
      </div>
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Left desktop nav */}
          <div className="flex-1 flex items-center justify-start">
            <div className="hidden md:flex space-x-6">
              {firstFew.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`hover:text-orange-600 transition ${
                    isActive(item.href) ? "border-b-2 border-orange-600" : ""
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex-1 flex items-center justify-end space-x-3">
            <div className="hidden md:flex items-center space-x-2">
              {!session ? (
                <>
                  <Link
                    href="/auth"
                    className="px-4 py-2 flex items-center text-white bg-orange-600 rounded-md"
                  >
                    <FaPlus className="pr-2" /> Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <img
                    src={session.user?.image || ""}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1 bg-orange-600 text-white rounded"
                  >
                    Sign Out
                  </button>
                </>
              )}

              {/* ⭐ Desktop More Sheet */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                
                <SheetTrigger className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                  More
                </SheetTrigger>

                <SheetContent side="right" className="w-80 sm:w-96">
                  <SheetHeader>
                    <SheetTitle className="text-md font-lighter border-b py-4">
                      Explore
                    </SheetTitle>
                  </SheetHeader>

                  {/* Animated links using framer-motion */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 flex flex-col justify-center items-center space-y-4"
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSheetOpen(false)} // close sheet on click
                        className="text-md uppercase text-gray-700 hover:text-orange-600"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Mobile-only hamburger */}
            <div className="md:hidden">
              <button onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? (
                  <HiOutlineX className="w-6 h-6 text-white" />
                ) : (
                  <HiOutlineMenu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Container>

      {/* Center Logo */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Link href="/">
          <FaSpa className="text-orange-600 text-3xl" />
        </Link>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-gray-900/90 text-white p-6 space-y-4"
            style={{ height: "calc(100vh - 64px)" }}
          >
            <div className="text-sm opacity-80 mb-3">MENU</div>

            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-lg hover:text-orange-500"
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
