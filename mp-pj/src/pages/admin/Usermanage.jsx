import React, { useState, useMemo, useEffect } from 'react';
import UserRowmanage from '../../components/UserRowmanage';
import Pagination from '../../components/Pagination'; 
import AddUserModal from '../../components/AddUserModal';
import ConfirmationModal from '../../components/ConfirmationModal'; 
import { SearchIcon, XIcon, PlusIcon } from '@heroicons/react/solid';

const ITEMS_PER_PAGE = 10;

function UserManage() {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null); 

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.error('No JWT token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/employees', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.map((user) => ({
            ...user,
            // ใช้ employeeId เป็น key สำหรับการค้นหา/จัดการใน frontend
            id: user.employeeId,
        })));
      } else {
        console.error("Failed to fetch user list, status:", response.status);
      }
    } catch (error) {
      console.error('Error fetching user list:', error);
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

  const itemsOnCurrentPage = paginatedUsers.length;
  const totalItems = filteredUsers.length;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // เปลี่ยนไปใช้ employeeId
  const handleEditUser = (employeeId) => {
    const user = users.find(u => u.id === employeeId);
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // เปลี่ยนไปใช้ employeeId
  const handleDeleteUser = (employeeId) => {
    const user = users.find(u => u.id === employeeId);
    setUserToDelete(user); 
  };

  // อัปเดต: ใช้ API ในการลบ
  const confirmDeleteHandler = async () => {
    if (!userToDelete) return; 

    const url = `/api/admin/employees/${userToDelete.employeeId}`; // สมมติว่าใช้ employeeId ในการอ้างอิง

    try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.ok || response.status === 204) { 
            showNotification(`ลบผู้ใช้ ${userToDelete.firstName} สำเร็จ`, 'success');
            // Re-fetch ข้อมูลใหม่ทั้งหมดหลังจากลบสำเร็จ
            fetchUsers(); 
        } else {
            const result = await response.json();
            const errorMessage = result.error || result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล';
            showNotification(`ลบผู้ใช้ไม่สำเร็จ: ${errorMessage}`, 'error');
            console.error("API Error:", result);
        }
    } catch (error) {
        showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
        console.error('Fetch Error:', error);
    } finally {
        setUserToDelete(null); 
    }
  };

  // อัปเดต: เพิ่มส่วนของการแก้ไขข้อมูล (PUT/PATCH)
  const handleSaveUser = async (userData) => {
    const isEditing = !!editingUser;
    
    // เตรียมข้อมูลที่ต้องการส่ง
    const dataToSubmit = {
        employeeId: userData.employeeId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role, 
        department: userData.department,
        position: userData.position,
    };
    
    // ส่งรหัสผ่านก็ต่อเมื่อมีการกรอก (กรณีเพิ่มผู้ใช้ใหม่) หรือมีการเปลี่ยนแปลง (กรณีแก้ไข)
    if (userData.password) {
        dataToSubmit.password = userData.password;
    }

    if (!isEditing) {
        // --- Logic สำหรับเพิ่มผู้ใช้ใหม่ (POST) ---
        const url = '/api/admin/employees';
        
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('เพิ่มผู้ใช้งานสำเร็จ!', 'success');
                fetchUsers();
            } else {
                const errorMessage = result.error || result.message || 'เกิดข้อผิดพลาด';
                showNotification(`เพิ่มผู้ใช้ไม่สำเร็จ: ${errorMessage}`, 'error');
                console.error("API Error:", result);
                return;
            }
        } catch (error) {
            showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
            console.error('Fetch Error:', error);
            return;
        }
    } else {
        // --- Logic สำหรับแก้ไขผู้ใช้ (PUT/PATCH) ---
        const url = `/api/admin/employees/${editingUser.employeeId}`; 

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(url, {
                method: 'PUT', // ใช้ PUT หรือ PATCH
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('แก้ไขข้อมูลผู้ใช้งานสำเร็จ!', 'success');
                fetchUsers(); // Re-fetch เพื่อให้ข้อมูลล่าสุดแสดงผล
            } else {
                const errorMessage = result.error || result.message || 'เกิดข้อผิดพลาด';
                showNotification(`แก้ไขผู้ใช้ไม่สำเร็จ: ${errorMessage}`, 'error');
                console.error("API Error:", result);
                return;
            }

        } catch (error) {
            showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
            console.error('Fetch Error:', error);
            return;
        }
    }

    // ปิด Modal เมื่อดำเนินการสำเร็จ
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <div> 
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-500">จัดการผู้ใช้งาน</h2>
            <p className="text-sm text-gray-400">เพิ่ม ลบ และแก้ไขข้อมูลผู้ใช้งานในระบบ</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            เพิ่มผู้ใช้งาน
          </button>
        </div>
        <hr className="border-t border-gray-300 mb-8" />

        <div className="mb-6 flex">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อ-นามสกุล/รหัส/อีเมล"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10 py-2 border-2 border-gray-300 rounded-md w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500 text-lg">
                กำลังโหลดข้อมูลผู้ใช้งาน...
            </div>
        ) : (
            <>
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
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

                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsers.length > 0 ? (
                            paginatedUsers.map(user => (
                            <UserRowmanage
                                key={user.id} // key คือ employeeId
                                user={user}
                                onEdit={handleEditUser} // ส่ง employeeId ไปยัง UserRowmanage
                                onDelete={handleDeleteUser} // ส่ง employeeId ไปยัง UserRowmanage
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
                </div>

                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsOnPage={itemsOnCurrentPage}
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
      
      <ConfirmationModal
        isOpen={!!userToDelete} 
        onClose={() => setUserToDelete(null)} 
        onConfirm={confirmDeleteHandler} 
        title="ยืนยันการลบผู้ใช้งาน"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้: ${userToDelete?.firstName} ${userToDelete?.lastName} (${userToDelete?.employeeId})?`}
      />

      {notification.show && (
        <div className="fixed top-20 right-5 z-50 animate-fade-in">
          <div 
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </div>
            <span className="font-semibold">{notification.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserManage;