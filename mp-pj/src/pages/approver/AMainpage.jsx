import React, { useState, useEffect, useRef } from 'react'; 
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import { getUserRequests } from '../../services/api'; 


const AMainpage = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); 
  const ITEMS_PER_PAGE = 10;

  
  const [inputDocNumber, setInputDocNumber] = useState('');// State สำหรับเก็บค่าที่แสดงใน input field
  const [inputStatus, setInputStatus] = useState('');
  const [filterDocNumber, setFilterDocNumber] = useState('');// State สำหรับเก็บค่าที่ใช้กรองข้อมูลจริงๆ
  const [filterStatus, setFilterStatus] = useState('');

  const docNumberInputRef = useRef(null);

  // ฟังก์ชันแปลงสถานะตามตาราง workflow
  const mapStatusForDisplay = (originStatus, hrStatus, overallStatus) => {
    // *** เช็คกรณี REJECTED ก่อน ***
    if (overallStatus === 'REJECTED') {
      // ถ้า origin_status เป็น MGR_REJECTED = ผู้จัดการปฏิเสธ
      if (originStatus === 'MGR_REJECTED') {
        return {
          managerStatus: 'ไม่อนุมัติ',
          hrStatus: '-',
          ceoStatus: '-'
        };
      }
      // ถ้า origin_status เป็น DIR_REJECTED = ผู้อำนวยการปฏิเสธ
      if (originStatus === 'DIR_REJECTED') {
        return {
          managerStatus: 'ไม่อนุมัติ',
          hrStatus: '-',
          ceoStatus: '-'
        };
      }
      // กรณีอื่นๆ ที่ถูกปฏิเสธ
      return {
        managerStatus: 'ไม่อนุมัติ',
        hrStatus: '-',
        ceoStatus: '-'
      };
    }
    
    // กรณีที่ 0: แบบร่าง
    if (originStatus === 'DRAFT') {
      return {
        managerStatus: 'แบบร่าง',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // กรณีที่ 1: ส่งคำขอแล้ว รอผู้จัดการแผนก
    if (originStatus === 'SUBMITTED') {
      return {
        managerStatus: 'รอผู้จัดการแผนก',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // กรณีที่ 2: ผู้จัดการแผนกอนุมัติแล้ว รอผู้อำนวยการฝ่าย
    if (originStatus === 'MGR_APPROVED') {
      return {
        managerStatus: 'รอผู้อำนวยการฝ่าย',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // === จากจุดนี้เป็นต้นไป origin_status = DIR_APPROVED แล้ว ===
    
    // กรณีที่ 3: ผอ.ฝ่ายอนุมัติแล้ว รอ Recruiter
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'WAITING_RECRUITER') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'รอ Recruiter',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // กรณีที่ 4: Recruiter รับเคสแล้ว รอผู้จัดการ HR
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_RECRUITER_APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'รอผู้จัดการ HR',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // เพิ่ม: รอผู้จัดการ HR (WAITING_HR_MANAGER)
    if (originStatus === 'DIR_APPROVED' && (hrStatus === 'WAITING_HR_MANAGER' || overallStatus === 'WAITING_HR_MANAGER')) {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'รอผู้จัดการ HR',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // กรณีที่ 5: ผู้จัดการ HR อนุมัติแล้ว รอผอ.ฝ่าย HR
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_MANAGER_APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'รอผอ.ฝ่าย HR'
      };
    }
    
    // เพิ่ม: รอผอ.ฝ่าย HR (WAITING_HR_DIRECTOR)
    if (originStatus === 'DIR_APPROVED' && (hrStatus === 'WAITING_HR_DIRECTOR' || overallStatus === 'WAITING_HR_DIRECTOR')) {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'รอผอ.ฝ่าย HR'
      };
    }
    
    // กรณีที่ 6: ผอ.ฝ่าย HR อนุมัติแล้ว - เสร็จสมบูรณ์
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_DIRECTOR_APPROVED' && overallStatus === 'APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'ได้รับการอนุมัติ'
      };
    }
    
    // กรณี HR_DIRECTOR_APPROVED แต่ยังไม่ APPROVED สมบูรณ์
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_DIRECTOR_APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // กรณี HR_INTAKE หรือสถานะอื่นๆ ของ HR เมื่อต้นสังกัดอนุมัติแล้ว
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_INTAKE') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'HR_INTAKE',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    // Default fallback
    return {
      managerStatus: originStatus || 'กำลังรอ',
      hrStatus: hrStatus || 'กำลังรอ',
      ceoStatus: overallStatus || 'กำลังรอ'
    };
  };

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await getUserRequests();
      
      // แปลงข้อมูลจาก API ให้ตรงกับ format ที่ตารางต้องการ
      const formattedData = data.map((item) => {
        // แปลงสถานะตามตาราง workflow
        const displayStatus = mapStatusForDisplay(
          item.origin_status, 
          item.hr_status, 
          item.overall_status
        );
        
        return {
          id: item.request_id,
          documentNumber: item.doc_number || '-',
          department: item.department_name || item.dept_name || '-',
          position: item.required_position_name || '-',
          quantity: item.num_required || 0,
          requester: item.requester_name || '-',
          // ใช้สถานะที่แปลงแล้ว
          managerStatus: displayStatus.managerStatus,
          hrStatus: displayStatus.hrStatus,
          ceoStatus: displayStatus.ceoStatus,
          // เก็บข้อมูลดิบไว้สำหรับการ debug หรือใช้งานอื่น
          originStatus: item.origin_status,
          rawHrStatus: item.hr_status,
          overallStatus: item.overall_status,
        };
      });
      
      setDocuments(formattedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // เรียกใช้งานเมื่อโหลดหน้า
  useEffect(() => {
    fetchRequests();
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
  

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <h2 className="text-2xl font-semibold text-gray-500 mb-8">รายการคำร้อง</h2>
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
            documents={currentDocuments} // ข้อมูลทั้งหมด
            isLoading={isLoading}
            role="approver"
            isApprovalMode={false} // <<-- บอกว่าไม่ต้องการปุ่ม
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


export default AMainpage;