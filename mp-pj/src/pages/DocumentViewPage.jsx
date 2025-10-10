import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { rawDocuments as mockApiData } from '../data/mockData';

// Helper Component สำหรับแสดงฟิลด์ข้อมูลให้ดูเหมือนฟอร์ม
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

  const document = mockApiData.find(doc => doc.id.toString() === id);

  if (!document) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-500">ไม่พบเอกสาร</h2>
        <p className="text-gray-500 mt-2">ไม่พบเอกสารที่คุณกำลังค้นหา</p>
        <Link to="/" className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          กลับไปหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        
        {/* === ส่วนหัวเรื่อง === */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          ใบร้องขอกำลังคน
        </h1>

        {/* === ส่วนฟอร์มข้อมูล === */}
        <div className="space-y-6">
          {/* แถวที่ 1: วันที่เอกสาร */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="วันที่เอกสาร" value={document.documentDate} />
            <div></div> {/* ปล่อยว่างเพื่อให้ layout สวยงาม */}
          </div>

          {/* แถวที่ 2: ฝ่าย, แผนก */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="ฝ่าย" value={document.division} />
            <FormField label="แผนก" value={document.department} />
          </div>

          {/* แถวที่ 3: ประเภทการจ้าง, ประเภทสัญญา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="ประเภทการจ้าง" value={document.employmentType} />
            <FormField label="ประเภทสัญญาจ้าง" value={document.contractType} />
          </div>

          {/* แถวที่ 4: เหตุผล, ชื่อผู้ร้องขอ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="เหตุผลที่ร้องขอ" value={document.reason} />
            <FormField label="ชื่อผู้ร้องขอ" value={document.requester} />
          </div>
        </div>
        
        {/* ========================================================== */}
        {/* === ส่วนคุณสมบัติ (แก้ไขโครงสร้างตรงนี้) === */}
        {/* ========================================================== */}
        <div className="mt-10 pt-6 border-t"> {/* เส้นคั่นเส้นเดียวที่ถูกต้อง */}
          
          {/* ย้ายหัวข้อมาไว้ตรงนี้ */}
          <h2 className="text-2xl font-bold text-gray-700 mb-6">คุณสมบัติ</h2>

          {/* Container หลักสำหรับฟิลด์ทั้งหมดในส่วนนี้ */}
          <div className="space-y-6">
            {/* แถวที่ 1: รหัสตำแหน่งงาน, ตำแหน่งที่ต้องการ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="รหัสตำแหน่งงาน" value={document.jobCode} />
              <FormField label="ตำแหน่งที่ต้องการ" value={document.positionRequired} />
            </div>

            {/* แถวที่ 2: อายุ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="อายุตั้งแต่ (ปี)" value={document.ageFrom} />
              <FormField label="ถึงอายุ (ปี)" value={document.ageTo} />
            </div>
            
            {/* แถวที่ 3: เพศ, สัญชาติ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="เพศ" value={document.gender} />
              <FormField label="สัญชาติ" value={document.nationality} />
            </div>

            {/* แถวที่ 4: ประสบการณ์, ระดับการศึกษา */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="ประสบการณ์" value={document.experience} />
              <FormField label="ระดับการศึกษา" value={document.educationLevel} />
            </div>

            {/* แถวที่ 5: คุณสมบัติพิเศษ (เต็มความกว้าง) */}
            <div>
              <FormField label="คุณสมบัติพิเศษ" value={document.specialQualifications} />
            </div>
          </div>
        </div>
        
        {/* === ปุ่มกลับ === */}
        <div className="mt-12 flex justify-start">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-800 px-8 py-2 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            กลับ
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default DocumentViewPage;