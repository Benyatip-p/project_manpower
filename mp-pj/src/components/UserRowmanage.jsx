import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from '@heroicons/react/solid';

function UserRowmanage({ user, onEdit, onDelete, onStatusToggle }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleTogglePassword = () => {
    if (isPasswordVisible) {
      setIsPasswordVisible(false);
      return;
    }
    const code = window.prompt('Enter admin code to view password');
    if (code === 'imadmin') {
      setIsPasswordVisible(true);
    } else if (code !== null) {
      window.alert('Incorrect code');
    }
  };

  return (
    <tr className="bg-white hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
        {user.role}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
        {user.employeeId}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
        {user.department}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
        {user.position}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500">
        {user.firstName || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500">
        {user.lastName || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono">
            {isPasswordVisible ? user.password : '•••••••'}
          </span>
          <button
            onClick={handleTogglePassword}
            className="text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
            title={isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            type="button"
          >
            {isPasswordVisible
              ? <EyeOffIcon className="w-5 h-5" />
              : <EyeIcon className="w-5 h-5" />
            }
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onEdit(user.employeeId)}
            className="text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
            title="แก้ไขข้อมูล"
            type="button"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(user.employeeId)}
            className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
            title="ลบผู้ใช้งาน"
            type="button"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default UserRowmanage;