import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { getUserRequests, decideManpowerRequest } from '../../services/api';

const Approve = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); 
  const ITEMS_PER_PAGE = 10;

  
  const [inputDocNumber, setInputDocNumber] = useState('');
  const [inputStatus, setInputStatus] = useState('');
  const [filterDocNumber, setFilterDocNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const docNumberInputRef = useRef(null);
  
  // ตรวจสอบ role ของผู้ใช้จาก token
  const [currentUserRole, setCurrentUserRole] = useState('manager'); // default
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // ฟังก์ชันแปลงสถานะตามตาราง workflow
  const mapStatusForDisplay = (originStatus, hrStatus, overallStatus) => {
    // เช็คกรณี REJECTED ก่อน
    if (overallStatus === 'REJECTED') {
      if (originStatus === 'MGR_REJECTED' || originStatus === 'DIR_REJECTED') {
        return {
          managerStatus: 'ไม่อนุมัติ',
          hrStatus: '-',
          ceoStatus: '-'
        };
      }
      return {
        managerStatus: 'ไม่อนุมัติ',
        hrStatus: '-',
        ceoStatus: '-'
      };
    }
    
    if (originStatus === 'DRAFT') {
      return {
        managerStatus: 'แบบร่าง',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    if (originStatus === 'SUBMITTED') {
      return {
        managerStatus: 'รอผู้จัดการแผนก',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    if (originStatus === 'MGR_APPROVED') {
      return {
        managerStatus: 'รอผู้อำนวยการฝ่าย',
        hrStatus: 'กำลังรอ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'WAITING_RECRUITER') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'รอ Recruiter',
        ceoStatus: 'กำลังรอ'
      };
    }
    
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
    
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_DIRECTOR_APPROVED' && overallStatus === 'APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'ได้รับการอนุมัติ'
      };
    }
    
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_DIRECTOR_APPROVED') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'ได้รับการอนุมัติ',
        ceoStatus: 'กำลังรอ'
      };
    }
    
    if (originStatus === 'DIR_APPROVED' && hrStatus === 'HR_INTAKE') {
      return {
        managerStatus: 'ได้รับการอนุมัติ',
        hrStatus: 'HR_INTAKE',
        ceoStatus: 'กำลังรอ'
      };
    }
    
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
      
      const formattedData = data.map((item) => {
        const displayStatus = mapStatusForDisplay(
          item.origin_status, 
          item.hr_status, 
          item.overall_status
        );
        
        return {
          id: item.request_id,
          documentNumber: item.doc_number || '-',
          documentDate: item.doc_date ? new Date(item.doc_date).toLocaleDateString('th-TH') : '-',
          department: item.department_name || item.dept_name || '-',
          position: item.required_position_name || '-',
          quantity: item.num_required || 0,
          requester: item.requester_name || '-',
          managerStatus: displayStatus.managerStatus,
          hrStatus: displayStatus.hrStatus,
          ceoStatus: displayStatus.ceoStatus,
          originStatus: item.origin_status,
          rawHrStatus: item.hr_status,
          overallStatus: item.overall_status,
        };
      });
      
      console.log("=== Fetched Documents ===");
      console.log("Total documents:", formattedData.length);
      console.log("Documents by status:");
      console.log("- SUBMITTED:", formattedData.filter(d => d.originStatus === 'SUBMITTED').length);
      console.log("- MGR_APPROVED:", formattedData.filter(d => d.originStatus === 'MGR_APPROVED').length);
      console.log("- DIR_APPROVED:", formattedData.filter(d => d.originStatus === 'DIR_APPROVED').length);
      
      setDocuments(formattedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ตรวจสอบ role จาก token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Token payload:", payload);
        
        // ใช้ pos_id และ dept_id เพื่อกำหนด role ที่แม่นยำ
        const posId = payload.pos_id || 0;
        const deptId = payload.dept_id || 0;
        console.log("Position ID:", posId, "Department ID:", deptId);
        
        // dept_id = 2 คือฝ่าย HR
        const isHRDept = deptId === 2;
        
        // กำหนด role ตาม pos_id และ dept_id
        let finalRole = 'manager'; // default
        
        if (posId === 1) {
          // pos_id = 1: ผู้จัดการ
          finalRole = isHRDept ? 'hr_manager' : 'manager';
        } else if (posId === 8) {
          // pos_id = 8: ผู้อำนวยการฝ่าย
          finalRole = isHRDept ? 'hr_director' : 'ceo';
        } else if (posId === 2) {
          // pos_id = 2: เจ้าหน้าที่ HR (Recruiter)
          finalRole = 'hr';
        }
        
        setCurrentUserRole(finalRole);
        
        console.log("=== User Role Detection ===");
        console.log("Set role based on pos_id:", finalRole);
        console.log("Position ID:", posId);
        console.log("Department ID:", deptId);
        console.log("Is HR Department:", isHRDept);
      } catch (e) {
        console.error("ไม่สามารถ decode token:", e);
      }
    }
    
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

  // ฟังก์ชันอนุมัติคำขอ
  const handleApprove = async (docId, approverType) => {
    setSelectedDocId(docId);
    setShowApproveModal(true);
  };

  // ฟังก์ชันยืนยันการอนุมัติ
  const confirmApprove = async () => {
    try {
      await decideManpowerRequest(selectedDocId, 'APPROVE', '');
      alert('อนุมัติคำขอเรียบร้อยแล้ว');
      setShowApproveModal(false);
      setSelectedDocId(null);
      // รีโหลดข้อมูลใหม่
      await fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message);
    }
  };

  // ฟังก์ชันปฏิเสธคำขอ
  const handleReject = async (docId, approverType) => {
    setSelectedDocId(docId);
    setShowRejectModal(true);
  };

  // ฟังก์ชันยืนยันการปฏิเสธ
  const confirmReject = async (notes) => {
    try {
      await decideManpowerRequest(selectedDocId, 'REJECT', notes);
      alert('ปฏิเสธคำขอเรียบร้อยแล้ว');
      setShowRejectModal(false);
      setSelectedDocId(null);
      // รีโหลดข้อมูลใหม่
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ: ' + error.message);
    }
  };

   // ฟังก์ชันเช็คว่าเอกสารนี้รอ role ปัจจุบันอนุมัติหรือไม่
  const canApproveDocument = useCallback((doc) => {
    console.log(`Checking canApprove for doc ${doc.documentNumber}:`, {
      currentUserRole,
      originStatus: doc.originStatus,
      rawHrStatus: doc.rawHrStatus,
      result: false
    });
    
    if (currentUserRole === 'manager') {
      const result = doc.originStatus === 'SUBMITTED';
      console.log(`-> Manager check: ${result}`);
      return result;
    } else if (currentUserRole === 'ceo') {
      const result = doc.originStatus === 'MGR_APPROVED';
      console.log(`-> CEO check: ${result}`);
      return result;
    } else if (currentUserRole === 'hr') {
      return doc.rawHrStatus === 'WAITING_RECRUITER';
    } else if (currentUserRole === 'hr_manager') {
      return doc.rawHrStatus === 'WAITING_HR_MANAGER' || doc.rawHrStatus === 'HR_RECRUITER_APPROVED';
    } else if (currentUserRole === 'hr_director') {
      return doc.rawHrStatus === 'WAITING_HR_DIRECTOR' || doc.rawHrStatus === 'HR_MANAGER_APPROVED';
    }
    return false;
  }, [currentUserRole]); // dependency: เมื่อ role เปลี่ยน ให้สร้างฟังก์ชันใหม่

   const filteredDocuments = documents.filter(doc => {
    // กรองตามฟิลเตอร์สถานะที่ผู้ใช้เลือก
    let statusMatch = true;
    
    if (filterStatus === 'ผ่านการอนุมัติ') {
      // ผ่านการอนุมัติ: ทั้ง 3 คอลัมน์ต้องเป็น 'ได้รับการอนุมัติ'
      statusMatch = doc.managerStatus === 'ได้รับการอนุมัติ' && 
                    doc.hrStatus === 'ได้รับการอนุมัติ' && 
                    doc.ceoStatus === 'ได้รับการอนุมัติ';
    } else if (filterStatus === 'รออนุมัติ') {
      // รออนุมัติ: แสดงเฉพาะเอกสารที่รอ role ปัจจุบันตัดสินใจ
      statusMatch = canApproveDocument(doc);
    } else if (filterStatus === 'ไม่อนุมัติ') {
      // ไม่อนุมัติ: คอลัมน์ใดคอลัมน์หนึ่งเป็น 'ไม่อนุมัติ'
      statusMatch = doc.managerStatus === 'ไม่อนุมัติ' || 
                    doc.hrStatus === 'ไม่อนุมัติ' || 
                    doc.ceoStatus === 'ไม่อนุมัติ';
    } else if (filterStatus !== '') {
      // กรณีอื่นๆ: ค้นหาตามสถานะปกติ (เช่น ค้นหาคำเฉพาะ)
      statusMatch = doc.managerStatus === filterStatus || 
                    doc.hrStatus === filterStatus || 
                    doc.ceoStatus === filterStatus;
    }
    
    // กรองตามเลขที่เอกสาร
    const searchMatch = filterDocNumber === '' || 
      doc.documentNumber.toLowerCase().includes(filterDocNumber.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  console.log("=== Filtered Documents ===");
  console.log("Current User Role:", currentUserRole);
  console.log("Filter Status:", filterStatus);
  console.log("Total documents after filter:", filteredDocuments.length);
  console.log("Documents that can be approved:", filteredDocuments.filter(canApproveDocument).length);



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
            canApprove={canApproveDocument} // <-- ส่งฟังก์ชันเช็คว่าสามารถอนุมัติได้หรือไม่
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

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={confirmApprove}
        title="ยืนยันการอนุมัติ"
        message="คุณต้องการอนุมัติคำขอนี้ใช่หรือไม่?"
        type="approve"
        showReasonInput={false}
      />

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={confirmReject}
        title="ยืนยันการปฏิเสธ"
        message="กรุณาระบุเหตุผลในการปฏิเสธคำขอ"
        type="reject"
        showReasonInput={true}
      />

    </div>
  );
}


export default Approve;