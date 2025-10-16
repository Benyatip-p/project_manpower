import { useState } from 'react';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

function UserStatusDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // ตัวเลือกสถานะสำหรับ Filter
  const options = ['อนุมัติ', 'ผ่านการอนุมัติ', 'รอการอนุมัติ', 'ไม่อนุมัติ'];

  const handleSelect = (option) => {
    onChange(option); 
    setIsOpen(false); 
  };

  return (
    <div className="relative w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-left"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || 'สถานะเอกสาร'}
        </span>
        
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div 
          className="absolute z-10 mt-2 w-full origin-top-right rounded-md border border-gray-300 bg-white shadow-lg"
        >
          <div className="py-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSelect('');
              }}
              className="block px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              สถานะทั้งหมด
            </a>

            {options.map((option) => (
              <a
                key={option}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(option); 
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserStatusDropdown;