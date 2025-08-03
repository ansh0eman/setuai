import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: 'suggestion',
      message: 'Upload EPF Registration to improve compliance score',
      priority: 'high'
    },
    {
      id: 2,
      type: 'alert',
      message: 'Factory License expires in 30 days',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'suggestion',
      message: 'Consider uploading ESIC Registration for better coverage',
      priority: 'low'
    }
  ]);

  const navLinks = [
    { path: '/dashboard', label: 'Documents' },
    { path: '/reports', label: 'Reports' }
  ];

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-ghost btn-circle transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className={`w-5 h-5 flex flex-col justify-center items-center transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}>
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-current rounded-full my-1 transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </div>
          </button>
          {isMenuOpen && (
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-white rounded-lg w-56 border border-gray-200 absolute top-full left-0 animate-fade-in">
              {navLinks.map(link => (
                <li key={link.path} className="mb-1">
                  <Link 
                    to={link.path}
                    className={`${location.pathname === link.path ? 'bg-green-100 text-green-800' : 'text-text-primary hover:bg-green-50'} rounded-md px-3 py-3 text-sm font-medium transition-all duration-200 text-center w-full flex justify-center items-center`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-red-600 hover:bg-red-50 rounded-md px-3 py-3 text-sm font-medium w-full text-center transition-all duration-200 flex justify-center items-center"
                >
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
      <div className="navbar-center">
        <Link to="/dashboard" className="btn btn-ghost text-xl">
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-bold">
            SetuAI
          </span>
        </Link>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="btn btn-ghost btn-circle transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="badge badge-xs badge-primary indicator-item">{notifications.length}</span>
            </div>
          </button>
          {isNotificationsOpen && (
            <div className="dropdown-content mt-3 z-[1] p-4 shadow-xl bg-white rounded-lg w-72 border border-gray-200 absolute top-full right-0 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-text-primary">Smart Compliance</h3>
                <button className="btn btn-ghost btn-xs text-text-secondary hover:text-text-primary">Mark all read</button>
              </div>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border ${
                    notification.priority === 'high' ? 'border-red-200 bg-red-50' :
                    notification.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.priority === 'high' ? 'bg-red-500' :
                        notification.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.type === 'suggestion' ? 'Smart Suggestion' : 'Alert'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}