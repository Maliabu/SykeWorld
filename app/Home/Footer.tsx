"use client";

import { useState } from "react";
import Container from "./Container";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { FaChevronCircleRight, FaFacebook, FaInstagram, FaSpa } from "react-icons/fa";
import { FaX } from "react-icons/fa6";

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
      const res = await fetch("http://localhost:8000/api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error("Failed to subscribe");

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
    <footer className="w-full bg-stone-100 text-stone-950 relative">
      <Container>
        <div className="grid gap-8 p-20 bg-white rounded-b-2xl lg:grid-cols-2 grid-cols-1">
          <div>
            <div className="text-2xl font-semibold">Subscribe</div>
            <div>Don't miss out on what's new! Keep in the loop.</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="gap-4 flex flex-col max-w-[300px]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="bg-gray-50 p-2 rounded"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="bg-gray-50 p-2 rounded"
              />
              <button
                type="submit"
                className="rounded-md bg-orange-600 p-2 text-white"
                disabled={loading}
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
          </form>
        </div>
      </Container>

      {/* Footer content */}
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:px-0 md:py-20 px-10 py-10">
          {/* About */}
          <div>
            <Link href="/">
              <FaSpa className="text-orange-600 h-8 w-8 mb-4" />
            </Link>
            <h4 className="text-lg mb-4">SykeWorld Hotel</h4>
            <p className="text-sm">
              Luxury meets serenity. Experience comfort like never before.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="hover:text-primary">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/roomservice" className="hover:text-primary">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/kitchen" className="hover:text-primary">
                  Bar & Restaurant
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg">Location</h4>
            <p className="text-sm">123 Luxury Ave, Paradise City</p>
            <p className="text-sm">info@horizonehotel.com</p>
            <h4 className="text-lg mt-4">Contact</h4>
            <p className="text-sm">+256 770 000 787</p>
            <p className="text-sm">+256 770 000 787</p>
            <h4 className="text-lg mt-4">Email</h4>
            <p className="text-sm">info@sykeworld.com</p>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-primary">
                <FaFacebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary">
                <FaX className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary">
                <FaInstagram className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex">
  <Link href="/visit" className="mt-4">
    <div className="bg-orange-600 text-white rounded-md px-4 py-2 flex items-center whitespace-nowrap">
      Visit Paidha <FaChevronCircleRight className="ml-2" />
    </div>
  </Link>
</div>
</div>
        </div>
      </Container>
    </footer>
  );
}
