import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// Import a CSS file for styling
import './Dashboard.css';
import { getDashboardOverview } from '../../services/api';

// --- Components ย่อยๆ สำหรับแสดงผลสถานะ ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-4 text-xl text-gray-600">Loading Dashboard...</p>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="flex justify-center items-center h-screen bg-red-50 p-4">
    <div className="text-center text-red-700">
      <h3 className="text-2xl font-bold">เกิดข้อผิดพลาด</h3>
      <p>{message}</p>
    </div>
  </div>
);

// สร้างตัวแปรเก็บสีสำหรับ Pie Chart
const PIE_CHART_COLORS = ['#9894e3ff', '#f1a942ff'];


// ----- ส่วน Component หลัก (รวม Home และ Dashboard เข้าด้วยกัน) -----
function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State สำหรับ filter เดือน/ปี
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // สร้างรายการเดือน
  const months = [
    { value: '', label: 'ทุกเดือน' },
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' },
  ];
  
  // สร้างรายการปี (ย้อนหลัง 5 ปี)
  const currentYear = new Date().getFullYear();
  const years = [
    { value: '', label: 'ทุกปี' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i + 543), // แสดงเป็นพ.ศ.
    })),
  ];

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // เรียก API พร้อม query parameters
        const apiResponse = await getDashboardOverview(selectedMonth, selectedYear);
        
        // แปลง API response เป็นรูปแบบที่ UI ต้องการ
        const transformedData = {
          stats: {
            totalRequests: apiResponse.totals?.requests || 0,
            pendingRequests: apiResponse.totals?.pending || 0,
            hireRate: apiResponse.totals?.approved || 0,
            resignationRate: apiResponse.totals?.rejected || 0,
          },
          pieData: [
            { 
              name: 'คำร้องที่อนุมัติแล้ว', 
              value: apiResponse.approval_pie?.approved || 0 
            },
            { 
              name: 'คำร้องรออนุมัติ', 
              value: apiResponse.approval_pie?.waiting || 0 
            },
          ],
          lineData: (apiResponse.per_department || []).map(dept => ({
            department: dept.dept_name || 'N/A',
            hires: dept.new_hires || 0,
            resignations: dept.resigns || 0,
          })),
        };

        setDashboardData(transformedData);

      } catch (err) {
        setError('ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [selectedMonth, selectedYear]); // ทำงานใหม่เมื่อเปลี่ยนเดือน/ปี

  const today = new Date();
  const dateString = today.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="p-8 bg-white min-h-screen rounded-md">
      <main className='main-container'>
        <div className='main-title'>
          <h2 className="text-2xl font-semibold text-gray-500 mb-8">Dashboard</h2>
          <hr className="border-t border-gray-300 mb-8" />
          <div className="date-print-section">
            <h3>{dateString}</h3>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors" onClick={() => window.print()}>
              พิมพ์รายงาน
            </button>
          </div>
        </div>

        <div className='main-cards'>
          <div className='card'>
            <h3>บันทึกคำร้องทั้งหมด</h3>
            <h1>{dashboardData.stats.totalRequests}</h1>
          </div>
          <div className='card'>
            <h3>คำร้องรออนุมัติ</h3>
            <h1>{dashboardData.stats.pendingRequests}</h1>
          </div>
          <div className='card'>
            <h3>คำร้องที่อนุมัติแล้ว</h3>
            <h1>{dashboardData.stats.hireRate}</h1>
          </div>
          <div className='card'>
            <h3>คำร้องที่ไม่อนุมัติ</h3>
            <h1>{dashboardData.stats.resignationRate}</h1>
          </div>
        </div>

        <div className='charts'>
          <div className='chart-row'>
            {/* Pie Chart */}
            <div className='chart-container'>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    isAnimationActive={false}
                  >
                    {dashboardData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <h4>สัดส่วนการอนุมัติใบคำร้อง</h4>
            </div>

            {/* Line Chart */}
           <div className='chart-container'>
              {/* Dropdown สำหรับเลือกเดือน/ปี */}
              <div className="mb-4 flex gap-4 justify-center">
                <div>
                  <label className="mr-2 text-sm font-medium text-gray-700">เดือน:</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mr-2 text-sm font-medium text-gray-700">ปี:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.lineData} isAnimationActive={false}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-15} textAnchor="end" height={50} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hires" name="พนักงานเข้าใหม่" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="resignations" name="พนักงานลาออก" stroke="#f1a942ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <h4>สรุปอัตราพนักงานเข้า-ออกรายแผนก</h4>
            </div>
          </div>
        </div> 
      </main>
    </div>
  );
}

export default Dashboard;