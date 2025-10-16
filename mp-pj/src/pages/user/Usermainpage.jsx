import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';
import { getUserRequests } from '../../services/api';

const Usermainpage = () => {
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); 
  const ITEMS_PER_PAGE = 10;

  
  const [inputDocNumber, setInputDocNumber] = useState('');
  const [inputStatus, setInputStatus] = useState('');
  const [filterDocNumber, setFilterDocNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const docNumberInputRef = useRef(null);

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
    
    return {
      managerStatus: originStatus || 'กำลังรอ',
      hrStatus: hrStatus || 'กำลังรอ',
      ceoStatus: overallStatus || 'กำลังรอ'
    };
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log("เริ่มดึงข้อมูลเอกสารจาก API..."); 
        console.log("Refresh trigger:", location.state?.refresh || location.key);
        
        // ตรวจสอบ token และข้อมูล user
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Token payload:", payload);
            console.log("Role:", payload.role_name);
            console.log("Department ID:", payload.dept_id);
            console.log("Section ID:", payload.section_id);
          } catch (e) {
            console.error("ไม่สามารถ decode token:", e);
          }
        }
        
        setIsLoading(true);
        const data = await getUserRequests();
        console.log("ข้อมูลที่ได้จาก API:", data);
        console.log("จำนวนรายการทั้งหมด:", data.length);
        
        const formattedData = data.map(item => {
          console.log("Raw item from API:", item); 
          
          const displayStatus = mapStatusForDisplay(
            item.origin_status, 
            item.hr_status, 
            item.overall_status
          );
          
          return {
            id: item.request_id,
            documentNumber: item.doc_number || '-',
            documentDate: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-',
            department: item.department_name || item.dept_name || '-', 
            managerStatus: displayStatus.managerStatus,
            hrStatus: displayStatus.hrStatus,
            ceoStatus: displayStatus.ceoStatus,
            dueDate: item.target_hire_date ? new Date(item.target_hire_date).toLocaleDateString('th-TH') : '-',
          };
        });
        
        setDocuments(formattedData);
        setIsLoading(false);      
        console.log("ดึงข้อมูลสำเร็จ!", formattedData.length, "รายการ");
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        setIsLoading(false);
        alert("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    };
    
    fetchRequests();
  }, [location.key, location.state?.refresh]); 

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

  const filteredDocuments = documents.filter(doc => {
    let statusMatch = true;
    
    console.log('=== Filter Debug ===');
    console.log('inputStatus:', inputStatus); 
    console.log('filterStatus:', filterStatus);
    console.log('Doc:', doc.documentNumber);
    console.log('managerStatus:', doc.managerStatus);
    console.log('hrStatus:', doc.hrStatus);
    console.log('ceoStatus:', doc.ceoStatus);
    
    const currentFilterStatus = inputStatus || filterStatus;
    
    if (currentFilterStatus === 'ผ่านการอนุมัติ') {
      // ผ่านการอนุมัติ: ทั้ง 3 คอลัมน์ต้องเป็น 'ได้รับการอนุมัติ'
      statusMatch = doc.managerStatus === 'ได้รับการอนุมัติ' && 
                    doc.hrStatus === 'ได้รับการอนุมัติ' && 
                    doc.ceoStatus === 'ได้รับการอนุมัติ';
      console.log('ผ่านการอนุมัติ check:', statusMatch);
    } else if (currentFilterStatus === 'รออนุมัติ') {
      // รออนุมัติ: แสดงเอกสารที่ยังไม่ได้รับการอนุมัติครบทั้ง 3 คอลัมน์
      // และยังไม่ถูกปฏิเสธ
      const isApproved = doc.managerStatus === 'ได้รับการอนุมัติ' && 
                        doc.hrStatus === 'ได้รับการอนุมัติ' && 
                        doc.ceoStatus === 'ได้รับการอนุมัติ';
      const isRejected = doc.managerStatus === 'ไม่อนุมัติ' || 
                        doc.hrStatus === 'ไม่อนุมัติ' || 
                        doc.ceoStatus === 'ไม่อนุมัติ';
      statusMatch = !isApproved && !isRejected;
      console.log('รออนุมัติ check:', statusMatch);
    } else if (currentFilterStatus === 'ไม่อนุมัติ') {
      // ไม่อนุมัติ: คอลัมน์ใดคอลัมน์หนึ่งเป็น 'ไม่อนุมัติ'
      statusMatch = doc.managerStatus === 'ไม่อนุมัติ' || 
                    doc.hrStatus === 'ไม่อนุมัติ' || 
                    doc.ceoStatus === 'ไม่อนุมัติ';
      console.log('ไม่อนุมัติ check:', statusMatch);
    } else if (currentFilterStatus !== '') {
      // กรณีอื่นๆ: ค้นหาตามสถานะปกติ
      statusMatch = doc.managerStatus === currentFilterStatus || 
                    doc.hrStatus === currentFilterStatus || 
                    doc.ceoStatus === currentFilterStatus;
    }
    
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

  const fetchRequests = async () => {
    try {
      console.log("เริ่มดึงข้อมูลเอกสารจาก API..."); 
      
      setIsLoading(true);
      const data = await getUserRequests();
      
      const formattedData = data.map(item => {
        const displayStatus = mapStatusForDisplay(
          item.origin_status, 
          item.hr_status, 
          item.overall_status
        );
        
        return {
          id: item.request_id,
          documentNumber: item.doc_number || '-',
          documentDate: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-',
          department: item.department_name || item.dept_name || '-',
          managerStatus: displayStatus.managerStatus,
          hrStatus: displayStatus.hrStatus,
          ceoStatus: displayStatus.ceoStatus,
          dueDate: item.target_hire_date ? new Date(item.target_hire_date).toLocaleDateString('th-TH') : '-',
        };
      });
      
      setDocuments(formattedData);
      setIsLoading(false);      
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      setIsLoading(false);
      alert("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDelete = async (documentId, documentNumber) => {
    if (!window.confirm(`คุณต้องการลบเอกสารเลขที่ "${documentNumber}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
      }

      console.log(`กำลังส่งคำขอลบเอกสาร ID: ${documentId} ไปยังเซิร์ฟเวอร์...`);
      
      const response = await fetch(`http://localhost:8080/api/user/requests/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถลบเอกสารได้');
      }
      
      alert('ลบเอกสารเรียบร้อยแล้ว');
      
      // ดึงข้อมูลใหม่ทันทีหลังจากลบสำเร็จ
      await fetchRequests();
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.message);
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