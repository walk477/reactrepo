import React from 'react';
import TestConnectionSection from './TestConnectionSection.jsx';

const LocalSettingsTab = ({ formData, handleChange, onTest, isTesting, testResult }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm">آدرس IP سیستم</label><input type="text" name="local_ip" value={formData.local_ip || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
            <div><label className="block text-sm">مسیر پوشه پروژه</label><input type="text" name="local_project_path" value={formData.local_project_path || ''} onChange={handleChange} className="mt-1 block w-full input"/></div>
        </div>
        <TestConnectionSection onTest={onTest} isTesting={isTesting} result={testResult} />
    </div>
);

export default LocalSettingsTab;
