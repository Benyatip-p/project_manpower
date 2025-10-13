import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const FormField = ({ label, value }) => {
  // Logic ที่ถูกต้อง: แสดงค่า 0 หรือค่าจริงอื่นๆ, ถ้าเป็น null/undefined/'' ให้แสดง '--'
  const displayValue = (value === 0 || value === '0' || value) ? value : '--';
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 min-h-[40px] flex items-center">
        {displayValue}
      </div>
    </div>
  );
};

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role) {
      setUserRole(role.toLowerCase());
    }
  }, []);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      if (!id || id === 'undefined') {
        setError('Invalid document ID');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/requests/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const doc = data.data;

          // Mapping logic, assuming Go BE now sends "" or 0 instead of null via COALESCE
          const transformedDoc = {
            id: doc.RequestID,
            documentNumber: doc.DocNumber ?? '',
            documentDate: doc.DocDate ?? '',
            division: doc.DepartmentName ?? '',
            department: doc.SectionName ?? '',
            employmentType: doc.EmploymentType ?? '',
            contractType: doc.ContractType ?? '',
            reason: doc.Reason ?? '',
            requester: doc.RequesterName ?? '',
            jobCode: doc.RequestingPosID ?? '',
            positionRequired: doc.RequiredPositionName ?? '',
            ageFrom: doc.MinAge, // Expect 0 or actual age
            ageTo: doc.MaxAge,   // Expect 0 or actual age
            gender: doc.Gender ?? '',
            nationality: doc.Nationality ?? '',
            experience: doc.Experience ?? '',
            educationLevel: doc.EducationLevel ?? '',
            specialQualifications: doc.SpecialQualifications ?? '',
            managerStatus: doc.OriginStatus,
            hrStatus: doc.HRStatus,
            ceoStatus: doc.OverallStatus
          };
          setDocument(transformedDoc);
        } else {
          setError('Document not found or data is incomplete');
        }
      } else if (response.status === 404) {
        setError('Document not found');
      } else if (response.status === 401) {
        setError('Authentication failed');
      } else {
        setError(`Failed to fetch document: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Error loading document');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      if (type === 'success' && (userRole === 'approve' || userRole === 'approver')) {
        navigate('/approver'); 
      }
    }, 1500);
  };

  // Logic สำหรับ Approve/Reject โดยใช้ Decide Handler
  const handleDecision = async (action) => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        showNotification('Authentication required', 'error');
        return;
      }

      // ใช้ Decide Handler สำหรับการดำเนินการทั้งหมด
      const response = await fetch(`/api/user/requests/${id}/decide`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action.toUpperCase(), notes: `${action} by ${userRole}` })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`${action === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ'}เอกสารเรียบร้อย`, 'success');
        fetchDocument(); // Reload to update status for next approver
      } else {
        const errorMessage = data.message || data.error || `Failed to ${action} document`;
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
      showNotification(`Error ${action}ing document`, 'error');
    }
  };

  // เงื่อนไขการแสดงปุ่ม: ต้องเป็น Approver และสถานะรวมต้องเป็น IN_PROGRESS
  const isApprover = userRole === 'approve' || userRole === 'approver';
  const showApprovalButtons = isApprover && document && document.ceoStatus === 'IN_PROGRESS';


  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-500 mt-4">กำลังโหลดเอกสาร...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-500">ไม่พบเอกสาร</h2>
        <p className="text-gray-500 mt-2">{error || 'ไม่พบเอกสารที่คุณกำลังค้นหา'}</p>
        <button onClick={() => navigate(-1)} className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          กลับไปหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">

        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          ใบร้องขอกำลังคน ({document.documentNumber})
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="วันที่เอกสาร" value={document.documentDate} />
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="ฝ่าย" value={document.division} />
            <FormField label="แผนก" value={document.department} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="ประเภทการจ้าง" value={document.employmentType} />
            <FormField label="ประเภทสัญญาจ้าง" value={document.contractType} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="เหตุผลที่ร้องขอ" value={document.reason} />
            <FormField label="ชื่อผู้ร้องขอ" value={document.requester} />
          </div>
        </div>
        <div className="mt-10 pt-6 border-t">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">คุณสมบัติ</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="รหัสตำแหน่งงาน" value={document.jobCode} />
              <FormField label="ตำแหน่งที่ต้องการ" value={document.positionRequired} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="อายุตั้งแต่ (ปี)" value={document.ageFrom} />
              <FormField label="ถึงอายุ (ปี)" value={document.ageTo} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="เพศ" value={document.gender} />
              <FormField label="สัญชาติ" value={document.nationality} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="ประสบการณ์" value={document.experience} />
              <FormField label="ระดับการศึกษา" value={document.educationLevel} />
            </div>
            <div>
              <FormField label="คุณสมบัติพิเศษ" value={document.specialQualifications} />
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 px-8 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            กลับ
          </button>

          {showApprovalButtons && (
            <div className="flex gap-4">
              <button
                onClick={() => handleDecision('REJECT')}
                className="rounded-md border border-transparent px-8 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
              >
                ไม่อนุมัติ
              </button>
              <button
                onClick={() => handleDecision('APPROVE')}
                className="rounded-md border border-transparent px-8 py-2 bg-green-500 text-base font-medium text-white hover:bg-green-600 focus:outline-none"
              >
                อนุมัติ
              </button>
            </div>
          )}
        </div>

      </div>

      {notification.show && (
        <div className="fixed top-13 right-5 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg backdrop-blur-sm ${notification.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
            }`}>
            <span className="text-xl">
              {notification.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="text-lg">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewPage;