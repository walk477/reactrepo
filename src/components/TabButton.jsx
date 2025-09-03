import React from 'react';

const TabButton = ({ active, onClick, children }) => (
    <button 
        type="button" 
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
        }`}
    >
        {children}
    </button>
);

export default TabButton;
