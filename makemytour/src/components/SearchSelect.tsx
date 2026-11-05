import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SearchSelect({
  options,
  placeholder,
  value,
  onChange,
  icon,
  subtitle,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter city/location options
  const filteredOptions = (options || []).filter((option: any) =>
    option.label
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">

      {/* Search Box */}
      <div
        className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer bg-white"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center space-x-2">

          {/* Icon */}
          {icon}

          <div className="flex-1 min-w-0">

            {/* Label */}
            <div className="text-sm text-gray-500 truncate">
              {placeholder}
            </div>

            {/* Input */}
            <Input
              type="text"
              value={value || searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                const text = e.target.value;

                setSearchTerm(text);
                onChange("");
                setIsOpen(true);
              }}
              className="font-semibold w-full bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={placeholder}
            />

            {/* Subtitle */}
            <div className="text-xs text-gray-400 truncate">
              {subtitle}
            </div>

          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">

          <ScrollArea className="h-64">

            {filteredOptions.length > 0 ? (

              filteredOptions.map((option: any) => (

                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start font-normal text-black hover:bg-gray-100"
                  onClick={() => {

                    // Select city
                    onChange(option.value);

                    // Clear typed search
                    setSearchTerm("");

                    // Close dropdown
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </Button>

              ))

            ) : (

              <div className="p-4 text-sm text-gray-500 text-center">
                No cities found
              </div>

            )}

          </ScrollArea>

        </div>
      )}
    </div>
  );
}