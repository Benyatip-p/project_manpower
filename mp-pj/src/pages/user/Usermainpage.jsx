import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination'; // <<< ตรวจสอบว่าใช้ Component นี้
import { rawDocuments as mockApiData } from '../../data/mockData';
import { PlusIcon } from '@heroicons/react/solid';

const Usermainpage = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [filterDocNumber, setFilterDocNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setDocuments(mockApiData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDocNumberChange = (e) => {
    setFilterDocNumber(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterDocNumber('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const MOCK_CURRENT_USER = {
    username: "somchai.j",
    department: "การตลาด"
  };

  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => doc.department === MOCK_CURRENT_USER.department);

    const lowerCaseFilter = filterDocNumber.toLowerCase();

    if (lowerCaseFilter) {
      filtered = filtered.filter(doc => doc.documentNumber.toLowerCase().endsWith(lowerCaseFilter));
    } else if (filterStatus) {
      filtered = filtered.filter(doc =>
        doc.managerStatus === filterStatus ||
        doc.hrStatus === filterStatus ||
        doc.ceoStatus === filterStatus
      );
    }

    return filtered;
  }, [documents, filterDocNumber, filterStatus]);

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const currentDocuments = filteredDocuments
    .slice(indexOfFirstItem, indexOfLastItem)
    .map((doc, index) => ({
      ...doc,
      itemNumber: indexOfFirstItem + index + 1,
    }));

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDelete = (documentId, documentNumber) => {
    if (window.confirm(`คุณต้องการลบเอกสารเลขที่ "${documentNumber}" ใช่หรือไม่?`)) {
      setDocuments(currentDocuments =>
        currentDocuments.filter(doc => doc.id !== documentId)
      );
      alert(`เอกสาร "${documentNumber}" ถูกลบเรียบร้อยแล้ว`);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-500">รายการคำร้อง</h2>
          <p className="text-sm text-gray-400">รายการคำร้องทั้งหมดของคุณ</p>
        </div>
        <Link
          to="/user/requestform"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          เพิ่มรายการคำร้อง
        </Link>
      </div>
      <hr className="border-t border-gray-300 mb-8" />

      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="docNumber" className="text-sm font-semibold text-gray-500 mb-2">เลขที่เอกสาร</label>
            <input
              id="docNumber"
              type="text"
              className="border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDocNumber}
              onChange={handleDocNumberChange}
              placeholder="ค้นหา..."
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="status" className="text-sm font-semibold text-gray-500 mb-2">สถานะ</label>
            <UserStatusDropdown
              id="status"
              value={filterStatus}
              onChange={handleStatusChange}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleClearFilters}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      { !isLoading && filteredDocuments.length === 0 ? (
        <div className="text-center py-12 border-t border-gray-200 mt-4">
          <p className="text-gray-500 text-lg">ไม่พบเอกสารที่ค้นหา</p>
          <p className="text-gray-400 text-sm mt-2">กรุณาลองตรวจสอบเลขที่เอกสารหรือสถานะอีกครั้ง</p>
        </div>
      ) : (
        <>
          <UserListTable
            documents={currentDocuments}
            isLoading={isLoading}
            role="user"
            onDelete={handleDelete}
          />
          {/* --- ตรวจสอบว่ามีการเรียกใช้ Pagination และส่ง props ครบถ้วน --- */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredDocuments.length} 
              itemsOnPage={currentDocuments.length} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Usermainpage;