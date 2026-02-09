import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiBook,
  FiEdit,
  FiUpload,
  FiBarChart2,
  FiFileText,
  FiEye
} from 'react-icons/fi';

const Sidebar = ({ isAdmin }) => {
  const adminLinks = [
    { to: '/', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/students', icon: FiUsers, label: 'Students' },
    { to: '/admin/subjects', icon: FiBook, label: 'Subjects' },
    { to: '/admin/marks', icon: FiEdit, label: 'Enter Marks' },
    { to: '/admin/marks-management', icon: FiEye, label: 'View All Marks' },
    { to: '/admin/bulk-upload', icon: FiUpload, label: 'Bulk Upload' },
  ];

  const studentLinks = [
    { to: '/', icon: FiHome, label: 'Dashboard' },
    { to: '/student/report', icon: FiFileText, label: 'My Report' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-4 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={navLinkClass}
                end={link.to === '/'}
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="px-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Quick Tips</h3>
              <ul className="mt-2 text-xs text-blue-600 space-y-1">
                {isAdmin ? (
                  <>
                    <li>• Use bulk upload for multiple students</li>
                    <li>• Assign subjects before entering marks</li>
                    <li>• Check dashboard for statistics</li>
                  </>
                ) : (
                  <>
                    <li>• View your progress report</li>
                    <li>• Check subject-wise performance</li>
                    <li>• Monitor your grades</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;