import React, { useState, useEffect, useRef } from 'react';

export const Dropdown = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className || ''}`}>
      <div onClick={toggleDropdown}>
        {children[0]}
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="py-1" role="none">
            {children[1]}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownButton = ({ children, className, ...props }) => (
  <button
    type="button"
    {...props}
    className={`inline-flex w-full justify-center items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ${className || ''}`}
    id="menu-button"
    aria-expanded="true"
    aria-haspopup="true"
  >
    {children}
  </button>
);


export const DropdownMenu = ({ children }) => {
    return <>{children}</>;
};

export const DropdownItem = ({ children, onClick, href }) => {
  const Tag = href ? 'a' : 'button';

  return (
    <Tag
      href={href}
      onClick={onClick}
      className="text-neutral-900 block w-full text-left px-4 py-2  hover:bg-gray-100 hover:text-neutral-900"
      role="menuitem"
      tabIndex="-1"
    >
      {children}
    </Tag>
  );
};

export const DropdownDivider = () => (
  <div className="border-t border-gray-200 my-1"></div>
);