import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

const UserRForm = () => {
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    documentDate: '',
    departmentId: '',
    sectionId: '',
    employmentTypeId: '',
    contractTypeId: '',
    requestReasonId: '',
    requesterName: '',
    positionId: '', // รหัสตำแหน่งงาน (string)
    requiredPositionId: '', // ID ตำแหน่งที่ต้องการ
    ageFrom: '',
    ageTo: '',
    genderId: '',
    nationalityId: '',
    experienceId: '',
    educationLevelId: '',
    specialQualifications: ''
  });

  const [masterData, setMasterData] = useState({
    departments: [],
    positions: [],
    sections: [],
    employmentTypes: [],
    contractTypes: [],
    requestReasons: [],
    genders: [],
    nationalities: [],
    experiences: [],
    educationLevels: []
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    setFormData(prev => ({ ...prev, documentDate: formattedDate }));

    const fetchMasterData = async () => {
      try {
        const response = await fetch('/api/masterdata');
        if (response.ok) {
          const data = await response.json();
          const formatData = (list) => list.map(item => ({...item, id: parseInt(item.id) || item.id}));

          setMasterData({
              departments: formatData(data.departments || []),
              positions: formatData(data.positions || []),
              sections: formatData(data.sections || []),
              employmentTypes: formatData(data.employmentTypes || []),
              contractTypes: formatData(data.contractTypes || []),
              requestReasons: formatData(data.requestReasons || []),
              genders: formatData(data.genders || []),
              nationalities: formatData(data.nationalities || []),
              experiences: formatData(data.experiences || []),
              educationLevels: formatData(data.educationLevels || [])
          });
        } else {
          console.error("Failed to fetch master data, status:", response.status);
          showNotification('ไม่สามารถดึงข้อมูลหลักได้', 'error');
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
        showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดึงข้อมูลหลัก', 'error');
      }
    };
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // แปลงค่าเป็น int สำหรับ ID fields แต่ยกเว้น positionId ที่เป็น string
    if ((name.endsWith('Id') || name.endsWith('ID')) && name !== 'positionId') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value) || '' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }

    setFormData(prev => ({ ...prev, documentDate: value }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const handleClear = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    setFormData({
      documentDate: formattedDate,
      departmentId: '',
      sectionId: '',
      employmentTypeId: '',
      contractTypeId: '',
      requestReasonId: '',
      requesterName: '',
      positionId: '',
      requiredPositionId: '',
      ageFrom: '',
      ageTo: '',
      genderId: '',
      nationalityId: '',
      experienceId: '',
      educationLevelId: '',
      specialQualifications: ''
    });
    showNotification('เริ่มต้นฟอร์มใหม่', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.ageFrom && formData.ageTo) {
      if (parseInt(formData.ageFrom) > parseInt(formData.ageTo)) {
        showNotification('อายุเริ่มต้นต้องน้อยกว่าหรือเท่ากับอายุสิ้นสุด', 'error');
        console.error('Validation Error: อายุไม่ถูกต้อง');
        return;
      }
    }

    // เตรียม Payload สำหรับ Go Backend โดยใช้ ID
    const dataToSubmit = {
      // required_position_name ต้องส่งเป็นชื่อตำแหน่ง
      required_position_name: masterData.positions.find(p => p.id === formData.requiredPositionId)?.name || '',
      num_required: 1, 
      employment_type_id: formData.employmentTypeId,
      contract_type_id: formData.contractTypeId,
      reason_id: formData.requestReasonId,
      min_age: formData.ageFrom ? parseInt(formData.ageFrom) : null,
      max_age: formData.ageTo ? parseInt(formData.ageTo) : null,
      gender_id: formData.genderId || null,
      nationality_id: formData.nationalityId || null,
      experience_id: formData.experienceId || null,
      education_level_id: formData.educationLevelId || null,
      special_qualifications: formData.specialQualifications,
      target_hire_date: null,
    };


    console.log('กำลังส่งข้อมูล:', dataToSubmit);

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        showNotification('กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
      }

      // Endpoint สำหรับ Submit request
      const response = await fetch('/api/user/requests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      console.log('Response จาก Server:', data);

      if (response.ok) {
        console.log('บันทึกข้อมูลสำเร็จ DocNo:', data.doc_number);
        showNotification(`บันทึกข้อมูลเสร็จสิ้น: ${data.doc_number}`, 'success');
        // Navigate back to main page after successful submission
        setTimeout(() => navigate('/user'), 1500);
      } else {
        const errorMessage = data.message || data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        console.error('บันทึกไม่สำเร็จ:', errorMessage);
        showNotification('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  return (
    <div className="min-h-screen p-5 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">ใบร้องขอกำลังคน</h2>

        <hr className="my-12 h-0.5 border-t-0 bg-neutral-200 opacity-100" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่เอกสาร</label>
              <input
                type="text"
                name="documentDate"
                value={formData.documentDate}
                onChange={handleDateChange}
                placeholder="DD/MM/YYYY"
                maxLength="10"
                required
                className="w-64 max-w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ฝ่าย</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกฝ่าย --</option>
                {masterData.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">แผนก</label>
              <select
                name="sectionId"
                value={formData.sectionId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกแผนก --</option>
                {masterData.sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทการจ้าง</label>
              <select
                name="employmentTypeId"
                value={formData.employmentTypeId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกประเภทการจ้าง --</option>
                {masterData.employmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทสัญญาจ้าง</label>
              <select
                name="contractTypeId"
                value={formData.contractTypeId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกประเภทสัญญา --</option>
                {masterData.contractTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เหตุผลที่ร้องขอ</label>
              <select
                name="requestReasonId"
                value={formData.requestReasonId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกเหตุผล --</option>
                {masterData.requestReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>{reason.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้ร้องขอ</label>
              <input
                type="text"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleChange}
                placeholder=""
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <hr className="my-12 h-0.5 border-t-0 bg-neutral-200 opacity-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสตำแหน่งงาน</label>
              <input
                type="text"
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                placeholder=""
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ตำแหน่งที่ต้องการ</label>
              <select
                name="requiredPositionId"
                value={formData.requiredPositionId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกตำแหน่ง --</option>
                {masterData.positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="my-12 h-0.5 border-t-0 bg-neutral-200 opacity-100" />

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">คุณสมบัติ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">อายุตั้งแต่ (ปี)</label>
              <input
                type="number"
                name="ageFrom"
                value={formData.ageFrom}
                onChange={handleChange}
                placeholder="18"
                min="15"
                max="100"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ถึงอายุ (ปี)</label>
              <input
                type="number"
                name="ageTo"
                value={formData.ageTo}
                onChange={handleChange}
                placeholder="60"
                min="15"
                max="100"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เพศ</label>
              <select
                name="genderId"
                value={formData.genderId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกเพศ --</option>
                {masterData.genders.map((gender) => (
                  <option key={gender.id} value={gender.id}>{gender.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">สัญชาติ</label>
              <select
                name="nationalityId"
                value={formData.nationalityId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกสัญชาติ --</option>
                {masterData.nationalities.map((nationality) => (
                  <option key={nationality.id} value={nationality.id}>{nationality.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประสบการณ์</label>
              <select
                name="experienceId"
                value={formData.experienceId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกประสบการณ์ --</option>
                {masterData.experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>{exp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ระดับการศึกษา</label>
              <select
                name="educationLevelId"
                value={formData.educationLevelId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกระดับการศึกษา --</option>
                {masterData.educationLevels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">คุณสมบัติพิเศษ</label>
            <textarea
              name="specialQualifications"
              value={formData.specialQualifications}
              onChange={handleChange}
              placeholder=""
              rows="4"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            />
          </div>

          <hr className="my-12 h-0.5 border-t-0 bg-neutral-200 opacity-100" />

          <div className="flex justify-between items-center pt-4">
            
            <button
              type="button"
              onClick={() => navigate(-1)} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              ย้อนกลับ
            </button>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-white py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                บันทึกข้อมูล
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-300 hover:bg-gray-400 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>

        </form>
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

export default UserRForm;