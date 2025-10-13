import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/solid';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';

// URL ฐานของ API (ควรอยู่ในไฟล์ Config จริง)
const API_BASE_URL = 'http://localhost:8080/api'; 

const Usermainpage = () => {
    // State Variables
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [inputDocNumber, setInputDocNumber] = useState('');
    const [inputStatus, setInputStatus] = useState('');
    
    const navigate = useNavigate();

    // **********************************************
    // ✅ Logic ที่ทำให้เกิดการ Refetch เมื่อถูก Redirect มา
    // **********************************************
    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('jwt_token');
                if (!token) {
                    console.error('No JWT token found');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch('/api/user/requests', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // หาก Token มีปัญหา อาจจะต้องไปหน้า Login
                    if (response.status === 401) {
                         // navigate('/login');
                    }
                    throw new Error(`Error fetching requests: ${response.statusText}`);
                }

                const result = await response.json();
                if (result.success && result.data) {
                    // Transform backend data to match frontend format
                    const transformedData = result.data.map(item => ({
                        id: item.request_id,
                        documentNumber: item.doc_number,
                        documentDate: item.doc_date,
                        department: item.department_name,
                        section: item.section_name,
                        position: item.pos_name,
                        requesterName: item.requester_name,
                        employmentType: item.employment_type_name,
                        contractType: item.contract_type_name,
                        requestReason: item.reason_name,
                        requiredPosition: item.required_position_name,
                        ageFrom: item.min_age,
                        ageTo: item.max_age,
                        gender: item.gender_name,
                        nationality: item.nat_name,
                        experience: item.exp_name,
                        educationLevel: item.edu_name,
                        specialQualifications: item.special_qualifications,
                        managerStatus: item.origin_status,
                        hrStatus: item.hr_status,
                        ceoStatus: item.overall_status,
                        dueDate: item.target_hire_date,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at
                    }));
                    setDocuments(transformedData);
                }

            } catch (error) {
                console.error("Failed to fetch manpower requests:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // การเรียกฟังก์ชันเมื่อ Component ถูก Mount หรือถูก Redirect มา
        fetchRequests();
    }, []); // 👈 Empty Dependency Array: โหลดครั้งเดียวเมื่อ Mount/Redirect มา

    // Action Handlers
    const handleCreateRequest = () => {
        navigate('/user/requestform');
    };

    const handleClearFilters = () => {
        setInputDocNumber('');
        setInputStatus('');
        setCurrentPage(1);
    };

    // FILTERING LOGIC
    const filteredDocuments = useMemo(() => {
        const trimmedSearch = inputDocNumber.trim().toLowerCase();

        return documents.filter(doc => {
            const statusMatch = inputStatus === '' ||
                doc.managerStatus === inputStatus ||
                doc.hrStatus === inputStatus ||
                doc.ceoStatus === inputStatus;

            const searchMatch = trimmedSearch === '' ||
                doc.documentNumber.toLowerCase().includes(trimmedSearch);

            return statusMatch && searchMatch;
        });
    }, [documents, inputDocNumber, inputStatus]);

    // รีเซ็ตหน้าเมื่อมีการเปลี่ยน Filter
    useEffect(() => {
        setCurrentPage(1);
    }, [inputDocNumber, inputStatus]);

    // Pagination Calculations
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

    // Delete Handler with API call
    const handleDelete = async (documentId, documentNumber) => {
        if (window.confirm(`คุณต้องการลบเอกสารเลขที่ "${documentNumber}" ใช่หรือไม่?`)) {
            try {
                const token = localStorage.getItem('jwt_token');
                if (!token) {
                    alert('Authentication required');
                    return;
                }

                const response = await fetch(`/api/user/requests/${documentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert(`เอกสาร "${documentNumber}" ถูกลบเรียบร้อยแล้ว`);
                    // Remove from local state
                    setDocuments(prevDocs =>
                        prevDocs.filter(doc => doc.id !== documentId)
                    );
                } else {
                    const errorData = await response.json();
                    alert(`ลบเอกสารไม่สำเร็จ: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('เกิดข้อผิดพลาดในการลบเอกสาร');
            }
        }
    };

    // JSX Render
    return (
        <div className="p-8 bg-white min-h-screen rounded-md">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold text-gray-500">รายการคำร้อง</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        รายการคำร้องทั้งหมดของคุณ
                    </p>
                </div>
            </div>

            <hr className="border-t border-gray-300 my-8" />

            <div className="mb-6">
                <div className="flex flex-wrap items-end gap-4 justify-between">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="docNumber" className="text-sm font-semibold text-gray-500 mb-2">เลขที่เอกสาร </label>
                            <input
                                id="docNumber"
                                type="text"
                                className="border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={inputDocNumber}
                                onChange={(e) => setInputDocNumber(e.target.value)}
                                placeholder="ค้นหา..."
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
                            <button onClick={handleClearFilters} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md">
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={handleCreateRequest}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            เพิ่มรายการคำร้อง
                        </button>
                    </div>
                </div>
            </div>

            {!isLoading && filteredDocuments.length === 0 ? (
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