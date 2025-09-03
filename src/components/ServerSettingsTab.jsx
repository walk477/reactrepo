import React from 'react';
import TestConnectionSection from './TestConnectionSection.jsx';

const ServerSettingsTab = ({ formData, handleChange, onTest, isTesting, testResult }) => (
     <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm">آدرس IP</label><input type="text" name="server_ip" value={formData.server_ip || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
            <div><label className="block text-sm">پورت</label><input type="number" name="server_port" value={formData.server_port || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
            <div><label className="block text-sm">نام کاربری</label><input type="text" name="server_username" value={formData.server_username || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
            <div><label className="block text-sm">رمز عبور</label><input type="password" name="server_password" value={formData.server_password || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
            <div className="md:col-span-2"><label className="block text-sm">مسیر پروژه</label><input type="text" name="project_server_path" value={formData.project_server_path || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
        </div>
        <TestConnectionSection onTest={onTest} isTesting={isTesting} result={testResult} />
    </div>
);

export default ServerSettingsTab;
