// src/components/StatusBadge.jsx

import React from 'react';

const StatusBadge = ({ status }) => {
  // V V V --- เพิ่มบรรทัดนี้เพื่อ DEBUG --- V V V
  console.log('Status received by Badge:', `'${status}'`, typeof status);

  if (!status || status === '-') {
    return <span className="text-gray-400">-</span>;
  }

  // --- ทำให้ค่าที่รับมาเป็น String และตัดช่องว่างหัว-ท้ายออก ---
  // นี่คือการป้องกันปัญหาข้อมูลมีช่องว่างแฝงอยู่ (เช่น " อนุมัติ ")
  const trimmedStatus = String(status).trim(); 

  let badgeColor = '';
  let badgeText = trimmedStatus;

  switch (trimmedStatus) { // <-- ใช้ตัวแปรที่ clean แล้วมาเช็ค
    case 'ผ่านการอนุมัติ':
    case 'อนุมัติ':
    case 'Approved':
      badgeColor = 'bg-green-100 text-green-800';
      badgeText = 'อนุมัติ';
      break;

    case 'รออนุมัติ':
    case 'Pending':
      badgeColor = 'bg-yellow-100 text-yellow-800';
      badgeText = 'รออนุมัติ';
      break;

    case 'ไม่อนุมัติ':
    case 'Rejected':
      badgeColor = 'bg-red-100 text-red-800';
      badgeText = 'ไม่อนุมัติ';
      break;
      
    default:
      badgeColor = 'bg-gray-100 text-gray-800';
      badgeText = trimmedStatus;
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}
    >
      {badgeText}
    </span>
  );
};

export default StatusBadge;