import React from 'react';
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/solid";

import StatusBadge from './StatusBadge'; 

const ApproverStatusCell = ({ 
  doc, 
  status, 
  isApprovalMode, 
  approverType, 
  onApprove, 
  onReject 
}) => {

  // เงื่อนไข: ถ้าอยู่ใน "โหมดอนุมัติ" และสถานะคือ "รออนุมัติ" ให้แสดงปุ่ม
  const isPending = (s) => {
    if (!s) return false;
    const thai = String(s).trim();
    const up = thai.toUpperCase();
    return (
      thai === 'รออนุมัติ' ||
      thai === 'รอการอนุมัติ' ||
      up === 'IN_PROGRESS' ||
      up === 'SUBMITTED' ||
      up === 'MGR_APPROVED' ||
      up.includes('WAITING')
    );
  };

  if (isApprovalMode && isPending(status)) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <StatusBadge status={status} />
        <button
          onClick={() => onApprove(doc.id, approverType)}
          className="text-green-500 hover:text-green-700 focus:outline-none"
          title="ผ่านการอนุมัติ"
        >
          <CheckCircleIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => onReject(doc.id, approverType)}
          className="text-red-500 hover:text-red-700 focus:outline-none"
          title="ไม่อนุมัติ"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // กรณีอื่นๆ ทั้งหมด ให้แสดงแค่ Badge สถานะ
  // ซึ่งตอนนี้จะเรียกใช้ Component ที่ถูกต้องแล้วเช่นกัน
  return <StatusBadge status={status} />;
};

export default ApproverStatusCell;