import React, { useState } from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'approve', showReasonInput = false }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showReasonInput) {
      if (!reason.trim()) {
        alert('กรุณาระบุเหตุผล');
        return;
      }
      onConfirm(reason);
    } else {
      onConfirm();
    }
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${type === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className={`text-lg font-semibold ${type === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{message}</p>
          
          {showReasonInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธ..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              type === 'approve'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {type === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
