import Link from "next/link";
import { Upload, Menu, ChevronDown, PlusCircle, Search } from "lucide-react";

export const Navbar = () => {
  return (
    <div className="w-full">
      <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 text-white shadow-lg">
        {/* Brand Name */}
        <div className="text-2xl font-semibold tracking-wide">GenOntoAI</div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-base font-medium">
          <Link
            href="/protected"
            className="hover:text-gray-300 cursor-pointer p-2 bg-amber-200 rounded-lg text-black "
          >
            dashboard
          </Link>
          <Link href="/" className="hover:text-gray-300 cursor-pointer p-2">
            About us
          </Link>
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden">
          <Menu size={28} />
        </button>
      </nav>
    </div>
  );
};
