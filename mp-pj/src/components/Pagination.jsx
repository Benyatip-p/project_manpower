import React from 'react';

/**
 * Props ที่ต้องส่งเข้ามา:
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {function} onPageChange -ฟังก์ชันที่จะถูกเรียกเมื่อมีการเปลี่ยนหน้า
 * @param {number} totalItems - จำนวนข้อมูลทั้งหมด
 * @param {number} itemsOnPage - จำนวนข้อมูลที่แสดงในหน้าปัจจุบัน
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsOnPage }) => {
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // ฟังก์ชันสำหรับไปหน้าถัดไป
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  if (totalPages <= 1 && totalItems > 0) {
    return (
       <div className="flex items-center justify-start mt-4 py-3">
         <p className="text-sm text-gray-700">
            Total {totalItems} of {totalItems}
         </p>
       </div>
    );
  }

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
      <div>
        <p className="text-sm text-gray-700">
          Total {itemsOnPage} of {totalItems}
        </p>
      </div>

      <div className="flex items-center">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-l-md px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt; Previous
        </button>

        <span className="relative -ml-px inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 shadow-sm font-semibold hidden sm:inline-block">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative -ml-px inline-flex items-center rounded-r-md px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;