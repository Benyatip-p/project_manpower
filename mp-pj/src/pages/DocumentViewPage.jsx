import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/** แสดงค่า 0 ได้, ถ้า null/undefined/'' ให้เป็น -- */
const FormField = ({ label, value }) => {
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

/** กำหนดชุด role ให้ตรงกับ DB: Admin, Approve, User */
const APPROVER_ROLES = new Set(['approve', 'admin']); // ผู้มีสิทธิ์อนุมัติ
const USER_ROLES     = new Set(['user']);             // ผู้ใช้ทั่วไป
const normalizeRole  = (raw) => (raw ?? '').toString().trim().toLowerCase();

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState('');        // 'admin' | 'approve' | 'user'
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // โหลด role จาก localStorage และ normalize
  useEffect(() => {
    const raw = localStorage.getItem('user_role'); // ควรเป็น "Admin" | "Approve" | "User"
    setUserRole(normalizeRole(raw));               // -> "admin" | "approve" | "user"
    setRoleLoaded(true);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      // ถ้า approver อนุมัติ/ไม่อนุมัติเสร็จ ย้อนกลับหน้ารายการผู้อนุมัติ
      if (type === 'success' && APPROVER_ROLES.has(userRole)) {
        navigate('/approver');
      }
    }, 1500);
  };

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwt_token');
      if (!token) { setError('Authentication required'); return; }
      if (!id || id === 'undefined') { setError('Invalid document ID'); return; }

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
          const transformedDoc = {
            id: doc.request_id,
            documentNumber: doc.doc_number ?? '',
            documentDate: doc.doc_date ?? '',
            division: doc.department_name ?? '',
            department: doc.section_name ?? '',
            employmentType: doc.employment_type_name ?? '',
            contractType: doc.contract_type_name ?? '',
            reason: doc.reason_name ?? '',
            requester: doc.requester_name ?? '',
            jobCode: doc.requesting_pos_id ?? '',
            positionRequired: doc.required_position_name ?? '',
            ageFrom: doc.min_age,
            ageTo: doc.max_age,
            gender: doc.gender_name ?? '',
            nationality: doc.nat_name ?? '',
            experience: doc.exp_name ?? '',
            educationLevel: doc.edu_name ?? '',
            specialQualifications: doc.special_qualifications ?? '',
            managerStatus: doc.origin_status,
            hrStatus: doc.hr_status,
            ceoStatus: doc.overall_status,
          };
          setDocument(transformedDoc);
          setError(null);
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
    if (id) fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /** อนุมัติ/ไม่อนุมัติ (เฉพาะ Admin/Approve) */
  const handleDecision = async (action) => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) { showNotification('Authentication required', 'error'); return; }

      const response = await fetch(`/api/user/requests/${id}/decide`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: String(action).toUpperCase(), notes: `${action} by ${userRole}` })
      });

      // รองรับ 204
      let data = null;
      if (response.status !== 204) {
        try { data = await response.json(); } catch {}
      }

      if (response.ok) {
        showNotification(action === 'APPROVE' ? 'อนุมัติเอกสารเรียบร้อย' : 'ไม่อนุมัติเอกสารเรียบร้อย', 'success');
        fetchDocument(); // refresh สถานะ
      } else {
        const msg = data?.message || data?.error || `Failed to ${action} document`;
        showNotification(msg, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
      showNotification(`Error ${action}ing document`, 'error');
    }
  };

  /** ลบเอกสาร (เฉพาะ User) */
  const handleDelete = async () => {
    if (!window.confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) { showNotification('Authentication required', 'error'); return; }

      const response = await fetch(`/api/user/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 204 || response.ok) {
        showNotification('ลบเอกสารเรียบร้อย', 'success');
        setTimeout(() => navigate('/user'), 1500);
        return;
      }

      let data = null;
      try { data = await response.json(); } catch {}
      const errorMessage = data?.message || data?.error || 'Failed to delete document';
      showNotification(errorMessage, 'error');
    } catch (error) {
      console.error('Error deleting document:', error);
      showNotification('Error deleting document', 'error');
    }
  };

  // ====== เงื่อนไขแสดงปุ่มตาม role ======
  const isApprover = roleLoaded && APPROVER_ROLES.has(userRole); // admin/approve → เห็นปุ่มอนุมัติ/ไม่อนุมัติ
  const isUser     = roleLoaded && USER_ROLES.has(userRole);     // user → เห็นปุ่มลบเท่านั้น

  const showApprovalButtons = isApprover && !!document;
  const showDeleteButton    = isUser && !!document && document.ceoStatus !== 'APPROVED';

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

        {/* ข้อมูลเอกสาร */}
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

        {/* คุณสมบัติ */}
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

        {/* ปุ่มการกระทำ */}
        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 px-8 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            กลับ
          </button>

          <div className="flex gap-4">
            {showDeleteButton && (
              <button
                onClick={handleDelete}
                className="rounded-md border border-transparent px-8 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
              >
                ลบเอกสาร
              </button>
            )}

            {showApprovalButtons && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {notification.show && (
        <div className="fixed top-16 right-5 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg backdrop-blur-sm ${
              notification.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
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
