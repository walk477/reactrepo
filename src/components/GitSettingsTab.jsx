import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import GitSyncManager from './GitSyncManager.jsx';

const GitSettingsTab = ({ 
    customerId, 
    formData, 
    handleChange, 
    gitStatus, 
    isGitLoading, 
    gitOutput, 
    handleCheckStatus, 
    // handleSync,
    handleGitPush,
    initialSetup = false
}) => {
    const token = useSelector(state => state.auth.token);
    const [isConnectionTesting, setIsConnectionTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleInitialSetup = async () => {
        setIsConnectionTesting(true);
        setTestResult(null);
        console.log(formData);
        try {
            // بررسی اعتبارسنجی اطلاعات
            if (!formData.git_username || !formData.git_access_token) {
                throw new Error('نام کاربری و توکن دسترسی گیت‌هاب الزامی است');
            }

            // لیست پروژه‌های قابل پیاده‌سازی
            const projects = [];
            if (formData.git_react_repo) projects.push('react');
            if (formData.git_php_repo) projects.push('php');

            if (projects.length === 0) {
                throw new Error('حداقل یک آدرس مخزن باید وارد شود');
            }

            // پیاده‌سازی هر پروژه
            for (const projectType of projects) {
                const response = await fetch('http://localhost/api/git_push_api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        customerId,
                        projectType,
                        operation: 'initial_setup'
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(`خطا در پیاده‌سازی پروژه ${projectType}: ${data.error}`);
                }

                // بروزرسانی وضعیت مخزن
                await handleCheckStatus(projectType);
            }

            setTestResult({ 
                type: 'success', 
                message: `پیاده‌سازی ${projects.length} پروژه با موفقیت انجام شد`
            });
        } catch (error) {
            setTestResult({
                type: 'error',
                message: error.message
            });
        } finally {
            setIsConnectionTesting(false);
        }
    };

    // --- تابع جدید و مستقل handleSync ---
    const handleSync = async (type) => {
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
        setGitOutput(`در حال دریافت و همگام‌سازی تغییرات برای پروژه ${type}...`);

        try {
            const dataToSend = {
                customerId,
                projectType: type,
                // این فیلد حیاتی است تا بک‌اند بداند پروژه کجاست
                projectPath: type === 'react' ? formData.react_project_path : formData.php_project_path,
                customerBranch: type === 'react' ? formData.react_branch : formData.php_branch,
                gitUsername: formData.git_username,
                gitAccessToken: formData.git_access_token,
            };

            console.log("DEBUG: Sending data for SYNC from GitSettingsTab:", dataToSend);

            const response = await fetch('http://localhost/api/git_update_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'خطا در فرآیند همگام‌سازی');
            }

            setSuccessMessage(result.message || `پروژه ${type} با موفقیت به‌روزرسانی شد.`);
            if (result.details) {
                setGitOutput(prev => `${prev}\n${result.details}`);
            }
            
            await handleCheckStatus(type);

        } catch (error) {
            setError(error.message);
            setGitOutput(prev => `${prev}\nخطا: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestConnection = async () => {
        setIsConnectionTesting(true);
        setTestResult(null);
        try {
            // بررسی اعتبارسنجی اطلاعات گیت
            if (!formData.git_username || !formData.git_access_token) {
                throw new Error('نام کاربری و توکن دسترسی گیت‌هاب الزامی است');
            }

            // بررسی وجود حداقل یکی از مخازن
            if (!formData.git_react_repo && !formData.git_php_repo) {
                throw new Error('حداقل یک آدرس مخزن (React یا PHP) باید وارد شود');
            }

            // تست اتصال به مخازن
            const response = await fetch('http://localhost/api/git_test_connection.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId,
                    git_username: formData.git_username,
                    git_access_token: formData.git_access_token,
                    repositories: {
                        react: formData.git_react_repo,
                        php: formData.git_php_repo
                    }
                })
            });

            const data = await response.json();
            if (response.ok) {
                setTestResult({ 
                    type: 'success', 
                    message: data.message || 'اتصال به مخازن گیت با موفقیت برقرار شد'
                });
                
                // فعال کردن دکمه پیاده‌سازی اولیه
                if (!formData.git_react_repo && !formData.git_php_repo) {
                    setTestResult(prev => ({
                        ...prev,
                        message: prev.message + '. حالا می‌توانید پیاده‌سازی اولیه را انجام دهید.'
                    }));
                }
            } else {
                throw new Error(data.error || 'خطا در تست اتصال به مخازن');
            }
        } catch (error) {
            setTestResult({
                type: 'error',
                message: error.message
            });
        } finally {
            setIsConnectionTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* تنظیمات دسترسی گیت */}
            <div>
                <h3 className="text-md font-semibold text-gray-700 mb-4">تنظیمات دسترسی گیت</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام کاربری گیت‌هاب</label>
                        <input
                            type="text"
                            name="git_username"
                            value={formData.git_username || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">توکن دسترسی</label>
                        <input
                            type="password"
                            name="git_access_token"
                            value={formData.git_access_token || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full input"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            توکن را از بخش Settings {'>'} Developer settings {'>'} Personal access tokens در گیت‌هاب ایجاد کنید
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">روش اتصال</label>
                        <select
                            name="preferred_connection"
                            value={formData.preferred_connection || 'https'}
                            onChange={handleChange}
                            className="mt-1 block w-full input bg-white"
                        >
                            <option value="https">HTTPS</option>
                            <option value="ssh">SSH</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* تنظیمات مخازن */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-gray-700">تنظیمات مخازن</h3>
                    {initialSetup && (
                        <button
                            type="button"
                            onClick={() => handleInitialSetup()}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg 
                                     hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                                     transition-all duration-200 disabled:opacity-50"
                        >
                            پیاده‌سازی اولیه پروژه‌های شرکت
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-800">مخزن فرانت‌اند (React)</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">آدرس مخزن</label>
                            <input
                                type="text"
                                name="git_react_repo"
                                value={formData.git_react_repo || ''}
                                onChange={handleChange}
                                placeholder="https://github.com/username/repo"
                                className="mt-1 block w-full input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">شاخه (Branch)</label>
                            <input
                                type="text"
                                name="react_branch"
                                value={formData.react_branch || 'main'}
                                onChange={handleChange}
                                className="mt-1 block w-full input"
                            />
                        </div>
                        <GitSyncManager 
                            projectType="react"
                            repoUrl={formData.git_react_repo}
                            branch={formData.react_branch}
                            syncStatus={gitStatus.reactStatus}
                            onCheckStatus={() => handleCheckStatus('react')}
                            onSync={() => handleSync('react')}
                            onPush={() => handleGitPush('react')}
                            isLoading={isGitLoading}
                        />
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-800">مخزن بک‌اند (PHP)</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">آدرس مخزن</label>
                            <input
                                type="text"
                                name="git_php_repo"
                                value={formData.git_php_repo || ''}
                                onChange={handleChange}
                                placeholder="https://github.com/username/repo"
                                className="mt-1 block w-full input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">شاخه (Branch)</label>
                            <input
                                type="text"
                                name="php_branch"
                                value={formData.php_branch || 'main'}
                                onChange={handleChange}
                                className="mt-1 block w-full input"
                            />
                        </div>
                        <GitSyncManager 
                            projectType="php"
                            repoUrl={formData.git_php_repo}
                            branch={formData.php_branch}
                            syncStatus={gitStatus.phpStatus}
                            onCheckStatus={() => handleCheckStatus('php')}
                            onSync={() => handleSync('php')}
                            onPush={() => handleGitPush('php')}
                            isLoading={isGitLoading}
                        />
                    </div>
                </div>
            </div>

            {/* تست اتصال */}
            <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold text-gray-700">تست اتصال به مخازن</h3>
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isConnectionTesting || !formData.git_username || !formData.git_access_token}
                        className="bg-blue-50 text-blue-600 px-4 py-2 text-sm font-medium rounded-lg 
                                 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                                 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-2"
                    >
                        {isConnectionTesting && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        {isConnectionTesting ? 'در حال تست...' : 'تست اتصال'}
                    </button>
                </div>
                {testResult && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                        testResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {testResult.message}
                    </div>
                )}
            </div>

            {/* نمایش خروجی */}
            {gitOutput && (
                <pre className="mt-4 p-4 bg-gray-900 text-white rounded-lg text-xs whitespace-pre-wrap overflow-auto max-h-40">
                    {gitOutput}
                </pre>
            )}
        </div>
    );
};

export default GitSettingsTab;
