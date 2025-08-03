import React from 'react';

export default function Button({ 
  children, 
  variant = 'outline',
  icon,
  onClick,
  className = '',
  disabled = false,
  type = 'button'
}) {
  const baseStyles = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200";
  
  const variantStyles = {
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    primary: "bg-gray-100 hover:bg-gray-200 text-gray-700"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && (
        <span className="w-5 h-5 text-gray-500">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}