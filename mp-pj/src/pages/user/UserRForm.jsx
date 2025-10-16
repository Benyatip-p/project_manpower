import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserRForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    documentDate: '',
    departmentId: '',
    sectionId: '',
    positionId: '1', // ตั้งค่าเริ่มต้นเป็น 1 (field ถูกซ่อนแล้ว)
    employmentTypeId: '',
    contractTypeId: '',
    requestReasonId: '',
    requiredPositionName: '',
    numRequired: 1,
    ageFrom: '',
    ageTo: '',
    genderId: '',
    nationalityId: '',
    experienceId: '',
    educationLevelId: '',
    specialQualifications: '',
    targetHireDate: ''
  });

  const [currentUser, setCurrentUser] = useState(null);

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

  const getNameFromId = (id, listName) => {
    const list = masterData[listName] || [];
    const item = list.find(item => item.id === parseInt(id));
    return item ? item.name : '';
  };

  const getDepartmentName = () => {
    if (!formData.departmentId || !masterData.departments || masterData.departments.length === 0) {
      console.log('getDepartmentName: No data', { departmentId: formData.departmentId, departmentsCount: masterData.departments?.length });
      return 'กำลังโหลด...';
    }
    const dept = masterData.departments.find(d => d.id === parseInt(formData.departmentId));
    console.log('getDepartmentName:', { departmentId: formData.departmentId, found: dept?.name });
    return dept?.name || 'ไม่พบข้อมูล';
  };

  const getSectionName = () => {
    if (!formData.sectionId) {
      return 'ไม่มีแผนก';
    }
    if (!masterData.sections || masterData.sections.length === 0) {
      console.log('getSectionName: No sections data');
      return 'กำลังโหลด...';
    }
    const section = masterData.sections.find(s => s.id === parseInt(formData.sectionId));
    console.log('getSectionName:', { sectionId: formData.sectionId, found: section?.name });
    return section?.name || 'ไม่พบข้อมูล';
  };

  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    setFormData(prev => ({ ...prev, documentDate: formattedDate }));

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const response = await fetch(`/api/user/profile?email=${userEmail}`);
          if (response.ok) {
            const userData = await response.json();
            console.log('User Profile Data:', userData);
            setCurrentUser(userData);
            
            // ตรวจสอบว่ามี department_id/section_id หรือว่ามีแค่ชื่อ
            if (userData.department_id) {
              // กรณีที่มี ID มาตรงๆ
              setFormData(prev => ({
                ...prev,
                departmentId: userData.department_id,
                sectionId: userData.section_id || ''
              }));
            }
            // ถ้าไม่มี ID จะต้องรอ masterData มาก่อน แล้วค่อยหา ID จากชื่อ
          } else {
            console.error("Failed to fetch user profile, status:", response.status);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const fetchMasterData = async () => {
      try {
        const response = await fetch('/api/masterdata');
        if (response.ok) {
          const data = await response.json();
          console.log('Master Data:', data);
          console.log('Departments:', data.departments);
          console.log('Sections:', data.sections);
          setMasterData(data);
        } else {
          console.error("Failed to fetch master data, status:", response.status);
          showNotification('ไม่สามารถดึงข้อมูลหลักได้', 'error');
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
        showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดึงข้อมูลหลัก', 'error');
      }
    };
    
    fetchUserProfile();
    fetchMasterData();
  }, []);

  // เมื่อ masterData และ currentUser โหลดเสร็จแล้ว ให้หา ID จากชื่อ
  useEffect(() => {
    if (currentUser && masterData.departments.length > 0 && !formData.departmentId) {
      console.log('=== Matching User Department & Section ===');
      console.log('Current User:', currentUser);
      console.log('Department from profile:', currentUser.department);
      console.log('Section from profile:', currentUser.section);
      console.log('All sections in masterData:', masterData.sections);
      
      // หา department ID จากชื่อ
      const dept = masterData.departments.find(d => d.name === currentUser.department);
      console.log('Found department:', dept);
      
      // หา section ID จากชื่อ (ถ้ามี)
      let sectionId = '';
      if (currentUser.section) {
        console.log('Trying to find section:', currentUser.section);
        if (masterData.sections.length > 0) {
          const section = masterData.sections.find(s => s.name === currentUser.section);
          console.log('Found section:', section);
          sectionId = section ? section.id : '';
        } else {
          console.log('No sections in masterData yet');
        }
      } else {
        console.log('User has no section in profile');
      }
      
      if (dept) {
        setFormData(prev => ({
          ...prev,
          departmentId: dept.id,
          sectionId: sectionId
        }));
        console.log('✅ Set departmentId:', dept.id, 'sectionId:', sectionId);
      }
    }
  }, [currentUser, masterData.departments, masterData.sections]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name } = e.target;
    let value = e.target.value.replace(/\D/g, '');

    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
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
      departmentId: currentUser?.department_id || '', // ให้ใช้ department ของ user
      sectionId: currentUser?.section_id || '', // ให้ใช้ section ของ user
      positionId: '1', // ตั้งค่าเริ่มต้นเป็น 1
      employmentTypeId: '',
      contractTypeId: '',
      requestReasonId: '',
      requiredPositionName: '',
      numRequired: 1,
      ageFrom: '',
      ageTo: '',
      genderId: '',
      nationalityId: '',
      experienceId: '',
      educationLevelId: '',
      specialQualifications: '',
      targetHireDate: ''
    });
    showNotification('เริ่มต้นฟอร์มใหม่', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    console.log('=== Validation Check ===');
    console.log('departmentId:', formData.departmentId);
    console.log('positionId:', formData.positionId);
    console.log('requiredPositionName:', formData.requiredPositionName);
    console.log('employmentTypeId:', formData.employmentTypeId);
    console.log('contractTypeId:', formData.contractTypeId);
    console.log('requestReasonId:', formData.requestReasonId);
    
    if (!formData.departmentId) {
      showNotification('กรุณาเลือกฝ่าย', 'error');
      console.error('Validation Error: Missing department');
      console.log('Current formData:', formData);
      return;
    }
    
    if (!formData.requiredPositionName) {
      showNotification('กรุณากรอกชื่อตำแหน่งที่ต้องการ', 'error');
      return;
    }
    
    if (!formData.employmentTypeId || !formData.contractTypeId || !formData.requestReasonId) {
      showNotification('กรุณากรอกประเภทการจ้าง ประเภทสัญญา และเหตุผลการร้องขอ', 'error');
      console.error('Validation Error: Missing required fields');
      return;
    }

    if (formData.ageFrom && formData.ageTo) {
      if (parseInt(formData.ageFrom) > parseInt(formData.ageTo)) {
        showNotification('อายุเริ่มต้นต้องน้อยกว่าหรือเท่ากับอายุสิ้นสุด', 'error');
        console.error('Validation Error: อายุไม่ถูกต้อง');
        return;
      }
    }

    // สร้าง payload ตามที่ Backend ต้องการ
    const dataToSubmit = {
      // ข้อมูลแผนก/ฝ่าย/ตำแหน่งที่ต้องการขอ (จากฟอร์ม)
      requesting_dept_id: parseInt(formData.departmentId),
      requesting_section_id: formData.sectionId ? parseInt(formData.sectionId) : null,
      requesting_pos_id: parseInt(formData.positionId),
      
      required_position_name: formData.requiredPositionName,
      num_required: parseInt(formData.numRequired) || 1,
      employment_type_id: parseInt(formData.employmentTypeId),
      contract_type_id: parseInt(formData.contractTypeId),
      reason_id: parseInt(formData.requestReasonId),
      min_age: formData.ageFrom ? parseInt(formData.ageFrom) : null,
      max_age: formData.ageTo ? parseInt(formData.ageTo) : null,
      gender_id: formData.genderId ? parseInt(formData.genderId) : null,
      nationality_id: formData.nationalityId ? parseInt(formData.nationalityId) : null,
      experience_id: formData.experienceId ? parseInt(formData.experienceId) : null,
      education_level_id: formData.educationLevelId ? parseInt(formData.educationLevelId) : null,
      special_qualifications: formData.specialQualifications || '',
      target_hire_date: formData.targetHireDate || null // ตอนนี้เป็น YYYY-MM-DD แล้ว
    };

    console.log('กำลังส่งข้อมูล:', dataToSubmit);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/requests/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
         },
        body: JSON.stringify(dataToSubmit)
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      const data = await response.json();
      console.log('Response Data:', data);

      console.log('Response จาก Server:', data);

      // เช็ค status 200-299 (OK, Created, etc.) ถือว่าสำเร็จ
      if (response.ok) {
        console.log('บันทึกข้อมูลสำเร็จ:', data);
        showNotification('บันทึกข้อมูลเสร็จสิ้น กำลังกลับไปหน้ารายการ...', 'success');
        
        // รอ 2 วินาทีเพื่อให้ database commit และ user เห็น message
        // ส่ง state เพื่อบังคับให้ fetch ข้อมูลใหม่
        setTimeout(() => {
          navigate('/user', { state: { refresh: Date.now() } });
        }, 2000);
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
          {/* วันที่เอกสารจะถูกบันทึกอัตโนมัติโดย Backend */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ฝ่าย <span className="text-xs text-gray-500"></span>
              </label>
              <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                {getDepartmentName()}
              </div>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                disabled
                required
                style={{ display: 'none' }}
              >
                <option value="">-- เลือกฝ่าย --</option>
                {masterData.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                แผนก <span className="text-xs text-gray-500"></span>
              </label>
              <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                {getSectionName()}
              </div>
              <select
                name="sectionId"
                value={formData.sectionId}
                onChange={handleChange}
                disabled
                style={{ display: 'none' }}
              >
                <option value="">-- ไม่มีแผนก --</option>
                {masterData.sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>

            {/* ซ่อน field ตำแหน่งงาน แต่ยังส่งข้อมูลไปที่ backend */}
            <div style={{ display: 'none' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ตำแหน่งงาน (กลุ่มงาน)</label>
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="">-- เลือกตำแหน่งงาน --</option>
                {masterData.positions.map((position) => (
                  <option key={position.id} value={position.id}>{position.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">เลือกกลุ่มตำแหน่งงานที่ต้องการ เช่น ผู้จัดการ, เจ้าหน้าที่, พนักงาน</p>
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
            <div></div> {/* ช่องว่าง */}
          </div>

          <hr className="my-12 h-0.5 border-t-0 bg-neutral-200 opacity-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อตำแหน่งที่ต้องการ (Job Title)</label>
              <input
                type="text"
                name="requiredPositionName"
                value={formData.requiredPositionName}
                onChange={handleChange}
                placeholder="เช่น Senior Marketing Officer, HR Recruiter, Full-Stack Developer"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">ระบุชื่อตำแหน่งและรายละเอียดที่ต้องการอย่างชัดเจน</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">จำนวนคนที่ต้องการ</label>
              <input
                type="number"
                name="numRequired"
                value={formData.numRequired}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่ต้องการให้เริ่มงาน</label>
              <input
                type="date"
                name="targetHireDate"
                value={formData.targetHireDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
            <div></div> {/* ช่องว่างเพื่อ layout */}
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

          <div className="flex justify-end gap-4 pt-4">
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