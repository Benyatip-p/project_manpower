import React from 'react';

const UserProfilePopup = ({ isOpen, onClose, userData }) => {

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(17,24,39,0.3)] backdrop-blur-sm flex justify-center items-center z-50" 
      onClick={onClose} 
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-700 text-white flex items-center justify-center text-3xl font-semibold flex-shrink-0">
            {userData?.firstname?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {userData ? `${userData.firstname} ${userData.lastname}` : 'Loading...'}
            </h2>
            <p className="text-sm text-gray-600 capitalize">{userData?.role || '...'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600 py-2 border-b border-gray-200">
            <span className="font-medium">แผนก</span>
            <span className="font-semibold text-gray-800">
              {userData?.department || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 py-2 border-b border-gray-200">
            <span className="font-medium">ตำแหน่ง</span>
            <span className="font-semibold text-gray-800 capitalize">
              {userData?.position || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 py-2 border-b border-gray-200">
            <span className="font-medium">อีเมล</span>
            <span className="font-semibold text-gray-800">{userData?.email || '-'}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default UserProfilePopup;