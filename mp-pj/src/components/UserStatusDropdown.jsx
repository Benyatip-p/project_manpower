// src/components/UserStatusDropdown.jsx

import { useState } from 'react';

// ไอคอนลูกศร (SVG)
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

// --- 1. รับ props: value และ onChange เข้ามา ---
function UserStatusDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  // --- 2. เอา state 'selectedOption' ออกไป เพราะจะใช้ 'value' จาก props แทน ---
  // const [selectedOption, setSelectedOption] = useState(null);
  
  // เพิ่มตัวเลือก 'ไม่อนุมัติ' และ 'สถานะทั้งหมด'
  const options = ['ผ่านการอนุมัติ', 'รออนุมัติ', 'ไม่อนุมัติ'];

  // --- 3. สร้างฟังก์ชัน handleSelect เพื่อเรียก onChange ที่ได้รับมา ---
  const handleSelect = (option) => {
    onChange(option); // ส่งค่าที่เลือกกลับไปให้ Parent Component
    setIsOpen(false); // ปิด dropdown เมื่อเลือกแล้ว
  };

  return (
    <div className="relative w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-left"
      >
        {/* --- 4. เปลี่ยน selectedOption เป็น value ที่รับมาจาก props --- */}
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
             {/* --- 5. เพิ่มตัวเลือกสำหรับ "สถานะทั้งหมด" --- */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSelect(''); // ส่งค่าว่าง '' กลับไป ซึ่งหมายถึง "ทั้งหมด"
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