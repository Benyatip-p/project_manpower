import React, { useState, useEffect, useMemo } from 'react';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import { rawDocuments as mockApiData } from '../../data/mockData';

const Approve = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [inputDocNumber, setInputDocNumber] = useState('');
  const [inputStatus, setInputStatus] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setDocuments(mockApiData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleClearFilters = () => {
    setInputDocNumber('');
    setInputStatus('');
    setCurrentPage(1);
  };

  const filteredDocuments = useMemo(() => {
    const trimmedSearch = inputDocNumber.trim().toLowerCase();
    return documents.filter(doc => {
      const statusMatch =
        inputStatus === '' ||
        doc.managerStatus === inputStatus ||
        doc.hrStatus === inputStatus ||
        doc.ceoStatus === inputStatus;

      const searchMatch =
        trimmedSearch === '' ||
        doc.documentNumber.toLowerCase().includes(trimmedSearch);

      return statusMatch && searchMatch;
    });
  }, [documents, inputDocNumber, inputStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [inputDocNumber, inputStatus]);

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

  // ✅ แก้ Flow การอนุมัติให้ไล่ตามลำดับ Manager → HR → CEO
  const handleApprove = (docId) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id !== docId) return doc;

        if (doc.managerStatus === 'รออนุมัติ') {
          return { ...doc, managerStatus: 'ผ่านการอนุมัติ' };
        }

        if (doc.managerStatus === 'ผ่านการอนุมัติ' && doc.hrStatus === 'รออนุมัติ') {
          return { ...doc, hrStatus: 'ผ่านการอนุมัติ' };
        }

        if (
          doc.managerStatus === 'ผ่านการอนุมัติ' &&
          doc.hrStatus === 'ผ่านการอนุมัติ' &&
          doc.ceoStatus === 'รออนุมัติ'
        ) {
          return { ...doc, ceoStatus: 'ผ่านการอนุมัติ' };
        }

        return doc; // ถ้าไม่มีขั้นไหนเข้าเงื่อนไข ก็ไม่เปลี่ยน
      })
    );
  };

  const handleReject = (docId) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === docId
          ? { ...doc, ceoStatus: 'ไม่อนุมัติ' } // หรืออาจเปลี่ยนเป็น field ตาม role ที่ล็อกอิน
          : doc
      )
    );
  };

  const currentUserRole = 'ceo';

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <h2 className="text-2xl font-semibold text-gray-500 mb-8">รายการอนุมัติ</h2>
      <hr className="border-t border-gray-300 mb-8" />

      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="docNumber" className="text-sm font-semibold text-gray-500 mb-2">เลขที่เอกสาร </label>
            <input
              id="docNumber"
              type="text"
              className="border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputDocNumber}
              onChange={(e) => setInputDocNumber(e.target.value)}
              placeholder="ค้นหา..."
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="status" className="text-sm font-semibold text-gray-500 mb-2">สถานะ</label>
            <UserStatusDropdown
              id="status"
              value={inputStatus}
              onChange={(value) => setInputStatus(value)}
            />
          </div>

          <div className="flex space-x-2">
            <button onClick={handleClearFilters} className="bg-gray-300 hover:bg-gray-400 text-white-800 px-4 py-2 rounded-md">
              Clear
            </button>
          </div>
        </div>
      </div>

      {!isLoading && filteredDocuments.length === 0 ? (
        <div className="text-center py-12 border-t border-gray-200 mt-4">
          <p className="text-gray-500 text-lg">ไม่พบเอกสารที่ค้นหา</p>
          <p className="text-gray-400 text-sm mt-2">กรุณาลองตรวจสอบเลขที่เอกสารหรือสถานะอีกครั้ง</p>
        </div>
      ) : (
        <>
          <UserListTable
            documents={currentDocuments}
            isLoading={isLoading}
            role={currentUserRole}
            isApprovalMode={true}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredDocuments.length}
                itemsOnPage={currentDocuments.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Approve;
