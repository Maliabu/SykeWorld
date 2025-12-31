"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Home/Navbar";
import Footer from "./Home/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show navbar/footer on admin routes
  const isAdminRoute = pathname?.startsWith("/admin");
  
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}



