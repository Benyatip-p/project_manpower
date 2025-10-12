import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rawDocuments as mockApiData } from '../data/mockData';

const FormField = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 min-h-[40px] flex items-center">
      {value || '--'}
    </div>
  </div>
);

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

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

  const document = mockApiData.find(doc => doc.id.toString() === id);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      navigate(-1);
    }, 1500);
  };

  const handleApprove = () => {
    showNotification('อนุมัติเอกสารเรียบร้อย', 'success');
  };

  const handleReject = () => {
    showNotification('ไม่อนุมัติเอกสาร', 'error');
  };

  if (!document) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-500">ไม่พบเอกสาร</h2>
        <p className="text-gray-500 mt-2">ไม่พบเอกสารที่คุณกำลังค้นหา</p>
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
          ใบร้องขอกำลังคน
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

          {userRole === 'approve' && (
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                className="rounded-md border border-transparent px-8 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
              >
                ไม่อนุมัติ
              </button>
              <button
                onClick={handleApprove}
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