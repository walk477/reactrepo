import React from 'react';

const DeploymentTabs = ({ activeTab, handleTabChange }) => (
    <div>
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-3">تنظیمات استقرار پروژه</h2>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mt-4">
            <button type="button" onClick={() => handleTabChange('server')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'server' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>سرور / هاست</button>
            <button type="button" onClick={() => handleTabChange('git')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'git' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>مخزن گیت</button>
            <button type="button" onClick={() => handleTabChange('local')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'local' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>سیستم شخصی</button>
        </div>
    </div>
);

export default DeploymentTabs;
