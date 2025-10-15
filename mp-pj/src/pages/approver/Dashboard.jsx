import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Import a CSS file for styling
import './Dashboard.css';

const API_BASE_URL = 'http://localhost:8080/api';

const fetchDashboardData = async () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const data = await response.json();
  return data;
};

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

const calculateHireRate = (departments) => {
  const totalHires = departments.reduce((sum, dept) => sum + dept.new_hires, 0);
  const totalResigns = departments.reduce((sum, dept) => sum + dept.resigns, 0);
  const totalEmployees = totalHires + totalResigns;
  if (totalEmployees === 0) return '0%';
  const rate = (totalHires / totalEmployees) * 100;
  return `${rate.toFixed(1)}%`;
};

const calculateResignationRate = (departments) => {
  const totalResigns = departments.reduce((sum, dept) => sum + dept.resigns, 0);
  const totalHires = departments.reduce((sum, dept) => sum + dept.new_hires, 0);
  const totalEmployees = totalHires + totalResigns;
  if (totalEmployees === 0) return '0%';
  const rate = (totalResigns / totalEmployees) * 100;
  return `${rate.toFixed(1)}%`;
};


// ----- ส่วน Component หลัก (รวม Home และ Dashboard เข้าด้วยกัน) -----
function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchDashboardData();
        // Transform backend data to match frontend expected format
        const transformedData = {
          stats: {
            totalRequests: data.totals.requests,
            pendingRequests: data.totals.pending,
            hireRate: calculateHireRate(data.per_department),
            resignationRate: calculateResignationRate(data.per_department)
          },
          pieData: [
            { name: 'คำร้องที่อนุมัติแล้ว', value: data.approval_pie.approved },
            { name: 'คำร้องรออนุมัติ', value: data.approval_pie.waiting }
          ],
          lineData: data.per_department.map(dept => ({
            department: dept.dept_name,
            hires: dept.new_hires,
            resignations: dept.resigns
          }))
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
  }, []);

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
            <h3>อัตราการจ้างงานใหม่</h3>
            <h1>{dashboardData.stats.hireRate}</h1>
          </div>
          <div className='card'>
            <h3>อัตราการลาออก</h3>
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