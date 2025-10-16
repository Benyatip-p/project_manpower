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
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" colSpan="4" className="px-6 pt-3"></th>
              <th scope="colgroup" colSpan="3" className="px-6 pt-3 text-center">
                สถานะ
              </th>
              <th scope="col" colSpan="2" className="px-6 pt-3"></th>
            </tr>
            <tr>
              <th scope="col" className="px-6 py-3 text-center">No.</th>
              <th scope="col" className="px-6 py-3 text-center">เลขที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center">วันที่เอกสาร</th>
              <th scope="col" className="px-6 py-3 text-center">แผนก</th>
              <th scope="col" className="px-6 py-3 text-center">ต้นสังกัด</th>
              <th scope="col" className="px-6 py-3 text-center">HR</th>
              <th scope="col" className="px-6 py-3 text-center">ฝ่ายบริหาร</th>
              <th scope="col" className="px-6 py-3 text-center">วันที่ครบกำหนด</th>
              <th scope="col" className="px-6 py-3 text-center">Actions</th>
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

              const formatDate = (inputDate) => {
                if (!inputDate) return '-';

                try {
                  const d = new Date(inputDate);
                  if (isNaN(d)) return inputDate;

                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();

                  return `${day}/${month}/${year}`;
                } catch {
                  return inputDate;
                }
              };

              return (
                <tr key={doc.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{doc.documentNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{formatDate(doc.documentDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{doc.department}</td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ApproverStatusCell status={doc.managerStatusDisplay ?? doc.managerStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ApproverStatusCell status={doc.hrStatusDisplay ?? doc.hrStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ApproverStatusCell status={doc.ceoStatusDisplay ?? doc.ceoStatus} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">{formatDate(doc.dueDate)}</td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-4">
                      <Link
                        to={`${basePath}/view/${doc.id}`}
                        className="text-gray-400 hover:text-blue-600 focus:outline-none"
                        title="ดูรายละเอียด"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {role === 'user' && (
                        <button
                          onClick={() => onDelete(doc.id, doc.documentNumber)}
                          className="text-gray-400 hover:text-red-600 focus:outline-none"
                          title="ลบเอกสาร"
                        >
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