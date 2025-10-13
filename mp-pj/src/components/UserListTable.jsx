import React from 'react';
import { Link } from 'react-router-dom';
// สมมติว่ามี component สำหรับแสดง Badge สถานะ
import StatusBadge from './StatusBadge'; 

// เปลี่ยน prop name เป็น documents เพื่อให้สอดคล้องกับ Usermainpage.jsx
const UserListTable = ({ documents, isLoading, role, onDelete }) => {
    // กำหนดหัวตาราง
    const headers = [
        "วันที่เอกสาร",
        "เลขที่เอกสาร",
        "ตำแหน่งที่ต้องการ",
        "จำนวน",
        "สถานะ",
        "การดำเนินการ",
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12 border-t border-gray-200 mt-4">
                <p className="text-gray-500">กำลังโหลดข้อมูลรายการคำร้อง...</p>
            </div>
        );
    }

    // ตรวจสอบ documents.length แทน filteredDocuments.length
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-12 border-t border-gray-200 mt-4">
                <p className="text-gray-500 text-lg">ไม่พบรายการคำร้อง</p>
                <p className="text-gray-400 text-sm mt-2">กรุณาสร้างคำร้องใหม่ หรือตรวจสอบเงื่อนไขการค้นหา</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((request) => (
                        <tr key={request.request_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {/* แปลงวันที่ให้เป็นรูปแบบที่อ่านง่าย */}
                                {new Date(request.doc_date).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                {request.doc_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.required_position_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.num_required}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {/* ใช้ DisplayStatus จาก Backend */}
                                <StatusBadge status={request.display_status} /> 
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Link
                                    to={`/user/view/${request.request_id}`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                >
                                    รายละเอียด
                                </Link>
                                {/* ปุ่มลบสำหรับสาธิต */}
                                <button
                                    onClick={() => onDelete(request.request_id, request.doc_number)}
                                    className="text-red-600 hover:text-red-900 ml-2"
                                >
                                    ลบ
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserListTable;