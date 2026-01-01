import Footer from "./Footer";
import Navbar from "./Navbar";

export default function WebsiteLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <div>
          {children}
      </div>
    );
  }