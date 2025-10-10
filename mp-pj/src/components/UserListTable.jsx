// src/components/UserListTable.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, EyeIcon, CheckIcon, XIcon } from "@heroicons/react/solid";
import ApproverStatusCell from './ApproverStatusCell';

const UserListTable = ({ 
  documents, 
  isLoading, 
  onDelete,
  onApprove,
  onReject,
  role = 'user',
  isApprovalMode = false
}) => {
  console.log('Data received in UserListTable:', documents); 

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  }
  if (!documents || documents.length === 0) {
    return <div className="p-4 text-center text-gray-500">ไม่พบเอกสาร</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            {/* --- แถวที่ 1: สำหรับ Group Header --- */}
            <tr>
              <th scope="col" colSpan="4" className="px-6 pt-3"></th>
              <th scope="colgroup" colSpan="3" className="px-6 pt-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th scope="col" colSpan="3" className="px-6 pt-3"></th>
            </tr>
            {/* --- แถวที่ 2: สำหรับหัวข้อทั้งหมด (10 คอลัมน์) --- */}
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ต้นสังกัด</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ฝ่ายบริหาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">การอนุมัติ</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ครบกำหนด</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc, index) => {
              // Logic การหาค่า status และ approver type ที่เกี่ยวข้องกับ role ปัจจุบัน
              let relevantStatus = null;
              let relevantApproverType = null;

              if (role === 'manager') {
                relevantStatus = doc.managerStatus;
                relevantApproverType = 'managerStatus';
              } else if (role === 'hr') {
                relevantStatus = doc.hrStatus;
                relevantApproverType = 'hrStatus';
              } else if (role === 'ceo') { //admin = ผู้บริหาร
                relevantStatus = doc.ceoStatus;
                relevantApproverType = 'ceoStatus';
              }
              
              const canApprove = isApprovalMode && relevantStatus === 'รออนุมัติ';

              // --- ส่วนที่แก้ไข ---
              // สร้าง basePath (Path พื้นฐาน) ให้ตรงกับโครงสร้างใน AppRoutes.js
              let basePath;
              if (role === 'user') {
                basePath = '/user';
              } else if (role === 'manager' || role === 'hr' || role === 'ceo') {
                // สำหรับผู้อนุมัติทุกคน ให้ใช้ path /approver ตามที่กำหนดใน Router
                basePath = '/approver';
              } else {
                // Fallback สำหรับ role อื่นๆ เช่น admin
                basePath = `/${role}`;
              }
              // --- สิ้นสุดส่วนที่แก้ไข ---
               
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.documentNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.documentDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.department}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.managerStatus} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.hrStatus} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.ceoStatus} /></td>
                
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {canApprove ? (
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => onApprove(doc.id, relevantApproverType)}
                          className="p-1 text-green-500 rounded-full hover:bg-green-100 focus:outline-none"
                          title="อนุมัติ"
                        >
                          <CheckIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => onReject(doc.id, relevantApproverType)}
                          className="p-1 text-red-500 rounded-full hover:bg-red-100 focus:outline-none"
                          title="ไม่อนุมัติ"
                        >
                          <XIcon className="w-6 h-6" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-4">
                      {/* แก้ไขบรรทัดนี้: ให้ใช้ basePath ที่เราสร้างขึ้น */}
                      <Link 
                        to={`${basePath}/view/${doc.id}`} 
                        className="text-gray-400 hover:text-blue-600 focus:outline-none" 
                        title="ดูรายละเอียด"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {role === 'user' && (
                        <button onClick={() => onDelete(doc.id, doc.documentNumber)} className="text-gray-400 hover:text-red-600 focus:outline-none" title="ลบเอกสาร">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListTable;