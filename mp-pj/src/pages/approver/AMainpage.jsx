import React, { useState, useEffect, useMemo, useRef } from 'react';
import UserStatusDropdown from '../../components/UserStatusDropdown';
import UserListTable from '../../components/UserListTable';
import Pagination from '../../components/Pagination';

const AMainpage = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [inputDocNumber, setInputDocNumber] = useState('');
  const [inputStatus, setInputStatus] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
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
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Transform backend data to match frontend format
            const transformedData = data.data.map(item => ({
              id: item.RequestID,
              documentNumber: item.DocNumber,
              department: item.DepartmentName,
              section: item.SectionName,
              position: item.PositionName,
              requesterName: item.RequesterName,
              employmentType: item.EmploymentType,
              contractType: item.ContractType,
              requestReason: item.Reason,
              requiredPosition: item.RequiredPositionName,
              ageFrom: item.MinAge,
              ageTo: item.MaxAge,
              gender: item.Gender,
              nationality: item.Nationality,
              experience: item.Experience,
              educationLevel: item.EducationLevel,
              specialQualifications: item.SpecialQualifications,
              managerStatus: item.OriginStatus,
              hrStatus: item.HRStatus,
              ceoStatus: item.OverallStatus,
              createdAt: item.CreatedAt,
              updatedAt: item.UpdatedAt
            }));
            setDocuments(transformedData);
          }
        } else {
          console.error('Failed to fetch requests:', response.status);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleClearFilters = () => {
    setInputDocNumber('');
    setInputStatus('');
    setCurrentPage(1);
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [inputDocNumber, inputStatus]);


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

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-500">รายการคำร้อง</h2>
          <p className="mt-2 text-sm text-gray-700">
            รายการคำร้องทั้งหมด
          </p>
        </div>
      </div>

      <hr className="border-t border-gray-300 my-8" />


      <div className="mb-6">
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
            role="approver"
            isApprovalMode={false}
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
}

export default AMainpage;