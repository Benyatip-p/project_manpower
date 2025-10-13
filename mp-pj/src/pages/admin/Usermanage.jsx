import React, { useState, useMemo, useEffect } from 'react';
import UserRowmanage from '../../components/UserRowmanage';
import Pagination from '../../components/PaginationAdmin';
import AddUserModal from '../../components/AddUserModal';
import { SearchIcon, XIcon, PlusIcon } from '@heroicons/react/solid';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../services/api';

const ITEMS_PER_PAGE = 10;

function UserManage() {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      // ใช้ employeeId เป็น unique identifier แทน index
      setUsers(data.map((user, index) => ({ 
          ...user, 
          id: user.employeeId, // ใช้ employeeId จาก backend แทน
      })));
    } catch (error) {
      console.error('Error fetching user list:', error);
      alert('ไม่สามารถดึงข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); 

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const employeeId = user.employeeId.toLowerCase();
      const email = user.email.toLowerCase();
      
      return fullName.includes(searchLower) || employeeId.includes(searchLower) || email.includes(searchLower);
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const currentItemCount = paginatedUsers.length;
  const totalItemCount = filteredUsers.length;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId);
    console.log('Editing user:', user);
    console.log('Employee ID to edit:', user.employeeId);
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    console.log('Deleting user:', user);
    console.log('Employee ID to delete:', user.employeeId);
    
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้: ${user.firstName} ${user.lastName} (${user.employeeId})?`)) {
      try {
        const result = await deleteEmployee(user.employeeId);
        
        if (result.success) {
          alert(`ลบผู้ใช้ ${user.firstName} ${user.lastName} สำเร็จ`);
          fetchUsers();
          if (paginatedUsers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          alert(`เกิดข้อผิดพลาดในการลบผู้ใช้งาน: ${result.error || result.message}`);
        }
      } catch (error) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
        console.error('Delete Employee Error:', error);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    const isEditing = !!editingUser;
    
    const dataToSubmit = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role, 
        department: userData.department,
        position: userData.position,
    };
    
    if (!isEditing) {
        // สำหรับการเพิ่มใหม่ ต้องมี employeeId
        dataToSubmit.employeeId = userData.employeeId;
        
        try {
            const result = await createEmployee(dataToSubmit);
            
            if (result.success) {
                alert(`เพิ่มผู้ใช้งานสำเร็จ!`);
                fetchUsers();
            } else {
                alert(`เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน: ${result.error || result.message}`);
                console.error("API Error:", result);
                return;
            }
        } catch (error) {
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
            console.error('Create Employee Error:', error);
            return;
        }
    } else {
        // สำหรับการแก้ไข ไม่ต้องส่ง password ถ้าไม่ได้เปลี่ยน
        if (!userData.password || userData.password === '') {
            delete dataToSubmit.password;
        }
        
        try {
            const result = await updateEmployee(editingUser.employeeId, dataToSubmit);
            
            if (result.success) {
                alert('แก้ไขข้อมูลผู้ใช้งานสำเร็จ!');
                fetchUsers();
            } else {
                alert(`เกิดข้อผิดพลาดในการแก้ไขผู้ใช้งาน: ${result.error || result.message}`);
                console.error("API Error:", result);
                return;
            }
        } catch (error) {
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
            console.error('Update Employee Error:', error);
            return;
        }
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <br />
        <h1 className="text-3xl font-bold text-gray-800 mb-6">จัดการผู้ใช้งาน</h1>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อ-นามสกุล/รหัส/อีเมล"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <PlusIcon className="w-5 h-5" />
            เพิ่มผู้ใช้งาน
          </button>
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500 text-lg">
                กำลังโหลดข้อมูลผู้ใช้งาน...
            </div>
        ) : (
            <>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-center">บทบาท</th>
                        <th className="px-6 py-3 text-center">รหัสพนักงาน</th>
                        <th className="px-6 py-3 text-center">แผนก</th>
                        <th className="px-6 py-3 text-center">ตำแหน่ง</th>
                        <th className="px-6 py-3 text-left">ชื่อ</th>
                        <th className="px-6 py-3 text-left">นามสกุล</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-center">รหัสผ่าน</th>
                        <th className="px-6 py-3 text-center">จัดการ</th>
                    </tr>
                    </thead>

                    <tbody>
                    {paginatedUsers.length > 0 ? (
                        paginatedUsers.map(user => (
                        <UserRowmanage
                            key={user.id}
                            user={user}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                        />
                        ))
                    ) : (
                        <tr>
                        <td colSpan="9" className="text-center py-10 text-gray-500">
                            {searchTerm ? `ไม่พบข้อมูลผู้ใช้งานที่ค้นหา: "${searchTerm}"` : 'ไม่พบข้อมูลผู้ใช้งาน'}
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                    แสดง <span className="font-semibold">{currentItemCount}</span> จากทั้งหมด{' '}
                    <span className="font-semibold">{totalItemCount}</span> รายการ
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
                </div>
            </>
        )}
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />
    </div>
  );
}

export default UserManage;