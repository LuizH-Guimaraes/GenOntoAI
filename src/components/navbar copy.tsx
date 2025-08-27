import { useState, useRef } from "react";
import { Upload, Menu, ChevronDown, PlusCircle, Search } from "lucide-react";

interface NavProps {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addNodeClick: () => void;
}

export const Navbar = ({ handleFileChange, addNodeClick }: NavProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

  let timeout: NodeJS.Timeout;
  const handleMouseEnter = () => {
    clearTimeout(timeout);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setDropdownOpen(false);
    }, 300);
  };

  return (
    <div className="w-full">
      <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 text-white shadow-lg">
        {/* Brand Name */}
        <div className="text-2xl font-semibold tracking-wide">OntologyFlow</div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-base font-medium">
          <li className="hover:text-gray-300 cursor-pointer">Home</li>

          {/* Dropdown - Graph */}
          <li
            className="relative group cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1 hover:text-gray-300">
              Graph <ChevronDown size={18} />
            </div>

            {/* Dropdown Menu */}
            <ul
              ref={dropdownRef}
              className={`absolute left-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg transition-all duration-200 ${
                dropdownOpen
                  ? "opacity-100 visible scale-100"
                  : "opacity-0 invisible scale-95"
              }`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <li
                className="px-5 py-3 flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                onClick={addNodeClick}
              >
                <PlusCircle size={18} /> Add New Node
              </li>
              <li className="px-5 py-3 flex items-center gap-2 hover:bg-gray-700 cursor-pointer">
                <Search size={18} /> Search SPARQL
              </li>
            </ul>
          </li>

          <li className="hover:text-gray-300 cursor-pointer">About Us</li>
        </ul>

        {/* Upload File Button */}
        <div className="relative">
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-base font-medium transition"
          >
            <Upload size={20} /> Upload
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden">
          <Menu size={28} />
        </button>
      </nav>
    </div>
  );
};
