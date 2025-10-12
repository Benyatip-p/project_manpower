import React, { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  role: '',
  employeeId: '',
  department: '',
  position: '',
  firstName: '',
  lastName: '',
  email: '',
  password: ''
};

function AddUserModal({ isOpen, onClose, onSave, editingUser }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [masterData, setMasterData] = useState({
    roles: [],
    departments: [],
    positions: []
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const response = await fetch('/api/masterdata');
        if (response.ok) {
          const data = await response.json();
          
          console.log("Master Data Received from Backend:", data);
          console.log("Roles Array Status:", data.roles);

          setMasterData({
            roles: data.roles || [],
            departments: data.departments || [],
            positions: data.positions || []
          });
        } else {
          console.error("Failed to fetch master data for modal.");
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        role: editingUser.role || '',
        employeeId: editingUser.employeeId || '',
        department: editingUser.department || '',
        position: editingUser.position || '',
        firstName: editingUser.firstName || '',
        lastName: editingUser.lastName || '',
        email: editingUser.email || '',
        password: editingUser.password || ''
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [editingUser, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.employeeId || !formData.password) {
        alert('กรุณากรอกข้อมูลที่จำเป็นทั้งหมดให้ครบถ้วน');
        return;
    }

    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_STATE); 
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-[rgba(17,24,39,0.3)] backdrop-blur-sm flex justify-center items-center z-40" 
        onClick={handleClose}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg z-50" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">
          {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสพนักงาน</label>
              <input 
                type="text" 
                name="employeeId" 
                value={formData.employeeId} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">บทบาท</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required
              >
                <option value="">-- เลือกบทบาท --</option>
                {Array.isArray(masterData.roles) && masterData.roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">แผนก</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
              >
                <option value="">-- เลือกแผนก --</option>
                {Array.isArray(masterData.departments) && masterData.departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ตำแหน่ง</label>
              <select
                name="position" 
                value={formData.position} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
              >
                <option value="">-- เลือกตำแหน่ง --</option>
                {Array.isArray(masterData.positions) && masterData.positions.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={handleClose} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {editingUser ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserModal;