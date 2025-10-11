import React, { useState, useEffect, useRef } from 'react';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import { rawDocuments as mockApiData } from '../../data/mockData'; 



const Usermainpage = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); 
  const ITEMS_PER_PAGE = 10;

  
  const [inputDocNumber, setInputDocNumber] = useState('');
  const [inputStatus, setInputStatus] = useState('');
  const [filterDocNumber, setFilterDocNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const docNumberInputRef = useRef(null);

  useEffect(() => {
    console.log("เริ่มดึงข้อมูลเอกสาร..."); 
    setTimeout(() => {
      setDocuments(mockApiData);
      setIsLoading(false);      
      console.log("ดึงข้อมูลสำเร็จ!");
    }, 1000);
  }, []);

  const handleSearch = () => {
    setFilterDocNumber(inputDocNumber);
    setFilterStatus(inputStatus);
    setCurrentPage(1);

     if (docNumberInputRef.current) {
      docNumberInputRef.current.blur();
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setInputDocNumber('');
    setInputStatus('');
    setFilterDocNumber('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const MOCK_CURRENT_USER = {
  username: "somchai.j",
  department: "การตลาด"
  };

  const filteredDocuments = documents
  .filter(doc => doc.department === MOCK_CURRENT_USER.department)
  .filter(doc => {
    const statusMatch = filterStatus === '' || 
      doc.managerStatus === filterStatus || 
      doc.hrStatus === filterStatus || 
      doc.ceoStatus === filterStatus;
    
    const searchMatch = filterDocNumber === '' || 
      doc.documentNumber.toLowerCase().includes(filterDocNumber.toLowerCase());
      
    return statusMatch && searchMatch;
  });



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
      console.log(`กำลังส่งคำขอลบเอกสาร ID: ${documentId} ไปยังเซิร์ฟเวอร์...`);
      
      setDocuments(currentDocuments =>
        currentDocuments.filter(doc => doc.id !== documentId)
      );
      alert(`เอกสาร "${documentNumber}" ถูกลบเรียบร้อยแล้ว`);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <h2 className="text-2xl font-semibold text-gray-500 mb-8">รายการคำร้อง</h2>
      <hr className="border-t border-gray-300 mb-8" />

      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4"> 
          
          <div className="flex flex-col">
            <label htmlFor="docNumber" className="text-sm font-semibold text-gray-500 mb-2">เลขที่เอกสาร</label>
            <input
              id="docNumber"
              ref={docNumberInputRef}
              type="text"
              className="border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputDocNumber}
              onChange={(e) => setInputDocNumber(e.target.value)}
              onKeyDown={handleKeyDown}
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
            <button 
              onClick={handleSearch} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Search
            </button>
            <button onClick={handleClearFilters} className="bg-gray-300 hover:bg-gray-400 text-white px-4 py-2 rounded-md">
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

export default Usermainpage;