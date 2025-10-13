// src/components/ApproverStatusCell.jsx

import React from 'react';
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/solid";

const ApproverStatusCell = ({ 
  doc, 
  status, 
  isApprovalMode, 
  approverType, 
  onApprove, 
  onReject 
}) => {
  
  // ฟังก์ชันกำหนดสีและไอคอนตามสถานะ
  const getStatusStyle = (status) => {
    if (!status || status === '-' || status === 'กำลังรอ') {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        display: 'กำลังรอ'
      };
    }
    
    // *** เช็คสถานะปฏิเสธก่อน (สีแดง) ***
    if (status.includes('ไม่อนุมัติ') || 
        status === 'REJECTED' ||
        status === 'MGR_REJECTED' ||
        status === 'DIR_REJECTED' ||
        status === 'HR_REJECTED') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        display: status.includes('ไม่อนุมัติ') ? status : 'ไม่อนุมัติ'
      };
    }
    
    // สถานะที่ได้รับการอนุมัติแล้ว (สีเขียว)
    if (status.includes('ได้รับการอนุมัติ') || 
        status.includes('อนุมัติ') || 
        status === 'APPROVED' ||
        status === 'MGR_APPROVED' ||
        status === 'DIR_APPROVED' ||
        status === 'HR_RECRUITER_APPROVED' ||
        status === 'HR_MANAGER_APPROVED' ||
        status === 'HR_DIRECTOR_APPROVED') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        display: status
      };
    }
    
    // สถานะที่กำลังรอดำเนินการ (สีเหลือง)
    if (status.includes('รอ') || 
        status === 'SUBMITTED' || 
        status === 'IN_PROGRESS' ||
        status === 'WAITING_RECRUITER' ||
        status === 'WAITING_HR_MANAGER' ||
        status === 'WAITING_HR_DIRECTOR' ||
        status === 'HR_INTAKE') {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        display: status
      };
    }
    
    // สถานะแบบร่าง (สีน้ำเงิน)
    if (status === 'DRAFT' || status === 'แบบร่าง') {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        display: 'แบบร่าง'
      };
    }
    
    // Default
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      display: status
    };
  };

  const style = getStatusStyle(status);

  // เงื่อนไข: ถ้าอยู่ใน "โหมดอนุมัติ" และสถานะคือ "รออนุมัติ" ให้แสดงปุ่ม
  if (isApprovalMode && status === 'รออนุมัติ') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          {style.display}
        </span>
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
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.display}
    </span>
  );
};

export default ApproverStatusCell;