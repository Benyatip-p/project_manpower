import React, { useState, useEffect, useRef } from 'react'; 
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import { rawDocuments as mockApiData } from '../../data/mockData'; 

const Approve = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); 
  const ITEMS_PER_PAGE = 10;

  
  const [inputDocNumber, setInputDocNumber] = useState('');// State สำหรับเก็บค่าที่แสดงใน input field
  const [inputStatus, setInputStatus] = useState('');
  const [filterDocNumber, setFilterDocNumber] = useState('');// State สำหรับเก็บค่าที่ใช้กรองข้อมูลจริงๆ
  const [filterStatus, setFilterStatus] = useState('');

  const docNumberInputRef = useRef(null);

  // useEffect ใช้สำหรับจำลองการดึงข้อมูลเมื่อคอมโพเนนต์ถูกโหลดครั้งแรก
  useEffect(() => {
      console.log("เริ่มดึงข้อมูลเอกสาร..."); 
      setTimeout(() => {
        setDocuments(mockApiData); // <<-- ใช้ข้อมูลที่ import เข้ามา
        setIsLoading(false);      
        console.log("ดึงข้อมูลสำเร็จ!");
      }, 1000);
    }, []);

  const handleSearch = () => {
    setFilterDocNumber(inputDocNumber);
    setFilterStatus(inputStatus);
    setCurrentPage(1); // กลับไปหน้าแรกทุกครั้งที่ค้นหา

     if (docNumberInputRef.current) {
      docNumberInputRef.current.blur();
    }
  };
  
  // จัดการการกด Enter ในช่องค้นหา
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

   const filteredDocuments = documents.filter(doc => {
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

  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ฟังก์ชันจัดการการลบ
  const handleDelete = (documentId, documentNumber) => {
    if (window.confirm(`คุณต้องการลบเอกสารเลขที่ "${documentNumber}" ใช่หรือไม่?`)) {
      console.log(`กำลังส่งคำขอลบเอกสาร ID: ${documentId} ไปยังเซิร์ฟเวอร์...`);
      // ในโปรเจกต์จริง:
      // 1. เรียก API เพื่อลบข้อมูลที่เซิร์ฟเวอร์
      // 2. เมื่อสำเร็จ ให้อัปเดต state ในหน้าเว็บเพื่อลบแถวนั้นออกไป
      setDocuments(currentDocuments =>
        currentDocuments.filter(doc => doc.id !== documentId)
      );
      alert(`เอกสาร "${documentNumber}" ถูกลบเรียบร้อยแล้ว`);
    }
  };
  const handleApprove = (docId, approverType) => {
    console.log(`Approving document ${docId} for role ${approverType}`);
    // TODO: เรียก API เพื่อส่งข้อมูลการอนุมัติ
    
    // อัปเดต UI ทันทีเพื่อประสบการณ์ที่ดีของผู้ใช้
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId 
          ? { ...doc, [approverType]: 'ผ่านการอนุมัติ' } 
          : doc
      )
    );
  };

  const handleReject = (docId, approverType) => {
    console.log(`Rejecting document ${docId} for role ${approverType}`);
    // TODO: เรียก API เพื่อส่งข้อมูลการไม่อนุมัติ

    // อัปเดต UI ทันที
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId 
          ? { ...doc, [approverType]: 'ไม่อนุมัติ' }
          : doc
      )
    );
  };
  
const currentUserRole  = 'ceo'; //สมมติให้เป็นฝ่ายบริหารในการกดอนุมัติ
  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <h2 className="text-2xl font-semibold text-gray-500 mb-8">รายการอนุมัติ</h2>
      <hr className="border-t border-gray-300 mb-8" />

      {/* --- 3. อัปเดตส่วน JSX ของฟอร์มค้นหา --- */}
      <div className="mb-6">
        <div className="flex items-end space-x-4">

          {/* กล่องค้นหาเลขที่เอกสาร */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-500 mb-2">เลขที่เอกสาร</label>
            <input
              ref={docNumberInputRef}
              type="text"
              className="border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputDocNumber}
              onChange={(e) => setInputDocNumber(e.target.value)}
              onKeyDown={handleKeyDown} 
            />
          </div>

          {/* กล่องเลือกสถานะ */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-500 mb-2">สถานะ</label>
            <UserStatusDropdown
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
        // กรณีที่: โหลดเสร็จแล้ว แต่ไม่พบข้อมูลจากการค้นหา
        <div className="text-center py-12 border-t border-gray-200 mt-4">
          <p className="text-gray-500 text-lg">ไม่พบเอกสารที่ค้นหา</p>
          <p className="text-gray-400 text-sm mt-2">กรุณาลองตรวจสอบเลขที่เอกสารหรือสถานะอีกครั้ง</p>
        </div>
      ) : (
        // กรณีที่: กำลังโหลด หรือ พบข้อมูล
        <>
          <UserListTable
            documents={currentDocuments}
            isLoading={isLoading}
            role={currentUserRole } // <-- ส่ง role ที่ถูกต้องเข้าไป
            isApprovalMode={true} 
            onApprove={handleApprove}
            onReject={handleReject}
        />
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredDocuments.length} // <-- เพิ่ม prop นี้: จำนวนข้อมูลทั้งหมด (หลังค้นหา)
              itemsOnPage={currentDocuments.length} // <-- เพิ่ม prop นี้: จำนวนข้อมูลในหน้าปัจจุบัน
            />
          </div>
        </>
      )}

    </div>
  );
}


export default Approve;