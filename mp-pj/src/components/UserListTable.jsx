import React from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, EyeIcon } from "@heroicons/react/solid";
import ApproverStatusCell from './ApproverStatusCell';

const UserListTable = ({ 
  documents, 
  isLoading, 
  onDelete,
  role = 'user'
}) => {

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
            <tr>
              <th scope="col" colSpan="4" className="px-6 pt-3"></th>
              <th scope="colgroup" colSpan="3" className="px-6 pt-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th scope="col" colSpan="2" className="px-6 pt-3"></th> 
            </tr>
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ต้นสังกัด</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ฝ่ายบริหาร</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ครบกำหนด</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc, index) => {
              let basePath;
              if (role === 'user') {
                basePath = '/user';
              } else if (role === 'approve' || role === 'manager' || role === 'hr' || role === 'ceo') {
                basePath = '/approver';
              } else {
                basePath = `/${role}`;
              }
               
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.documentNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.documentDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.department}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.managerStatus} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.hrStatus} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center"><ApproverStatusCell status={doc.ceoStatus} /></td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{doc.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-4">
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