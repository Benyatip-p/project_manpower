// src/components/StatusBadge.jsx

import React from 'react';

const StatusBadge = ({ status }) => {
  // 1. จัดการกับค่าว่าง หรือค่าที่ไม่ต้องการแสดงผลก่อน
  if (!status || status === '-' || status === 'undefined' || status === undefined || status === 'NONE') {
    return <span className="text-gray-400">-</span>;
  }

  // 2. เตรียมข้อมูล โดยแปลงเป็น String และตัดช่องว่างที่อาจติดมาออก
  const trimmedStatus = String(status).trim(); 

  let badgeColor = '';
  let badgeText = trimmedStatus;

  // 3. กำหนดสีและข้อความตามสถานะ (Normalize ให้แสดงรูปแบบเดียวกันในตาราง)
  const up = trimmedStatus.toUpperCase();

  const isRejected =
    trimmedStatus === 'ไม่อนุมัติ' ||
    up.includes('REJECT') ||
    up === 'REJECTED' ||
    up === 'DISAPPROVED';

  // หมายเหตุ: MGR_APPROVED เป็นการอนุมัติบางส่วนของต้นสังกัด ยังถือเป็น "รอการอนุมัติ"
  const isApproved =
    trimmedStatus === 'อนุมัติ' ||
    trimmedStatus === 'ผ่านการอนุมัติ' ||
    (up.includes('APPROVED') && up !== 'MGR_APPROVED');

  const isPending =
    trimmedStatus === 'รออนุมัติ' ||
    trimmedStatus === 'รอการอนุมัติ' ||
    up === 'PENDING' ||
    up === 'IN_PROGRESS' ||
    up === 'SUBMITTED' ||
    up === 'MGR_APPROVED' ||
    up === 'RETURNED' ||
    up.includes('WAITING');

  if (isRejected) {
    badgeColor = 'bg-red-100 text-red-800';
    badgeText = 'ไม่อนุมัติ';
  } else if (isApproved) {
    badgeColor = 'bg-green-100 text-green-800';
    badgeText = 'อนุมัติ';
  } else if (isPending) {
    badgeColor = 'bg-yellow-100 text-yellow-800';
    badgeText = 'รอการอนุมัติ';
  } else {
    // ค่าที่ไม่รู้จัก แสดงตามค่าเดิม (โทนเทา)
    badgeColor = 'bg-gray-100 text-gray-800';
    badgeText = trimmedStatus;
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