import React from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-[rgba(17,24,39,0.3)] backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()} 
      >
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-base text-gray-600">
              {message}
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="rounded-md border border-transparent px-6 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
            onClick={onConfirm}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;