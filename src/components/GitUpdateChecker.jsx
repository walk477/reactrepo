import React, { useState, useEffect } from 'react';
import { useGitOperations } from '../hooks/useGitOperations';

const GitUpdateChecker = ({ customerId }) => {
    const { isLoading, error, checkUpdates, executeGitCommand } = useGitOperations();
    const [updateStatus, setUpdateStatus] = useState(null);

    useEffect(() => {
        if (customerId) {
            handleCheckUpdates();
        }
    }, [customerId]);

    const handleCheckUpdates = async () => {
        try {
            const data = await checkUpdates(customerId);
            setUpdateStatus(data);
        } catch (err) {
            console.error('Error checking updates:', err);
        }
    };

    const handleSync = async (repoType) => {
        try {
            await executeGitCommand(customerId, 'sync', repoType);
            // بعد از sync، دوباره تغییرات را چک می‌کنیم
            handleCheckUpdates();
        } catch (err) {
            console.error(`Error syncing ${repoType}:`, err);
        }
    };

    const renderUpdateInfo = (updates, repoType) => {
        const status = updates?.[repoType]?.status;
        const message = updates?.[repoType]?.message;

        const statusStyles = {
            'not_configured': 'text-gray-700 bg-gray-100',
            'path_not_found': 'text-red-700 bg-red-100',
            'git_not_initialized': 'text-orange-700 bg-orange-100',
            'company_repo_error': 'text-red-700 bg-red-100',
            'needs_update': 'text-yellow-700 bg-yellow-100',
            'up_to_date': 'text-green-700 bg-green-100'
        };

        return (
            <div>
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${statusStyles[status] || 'text-gray-700 bg-gray-100'}`}>
                    {message}
                </span>
                
                {status === 'needs_update' && (
                    <>
                        <button
                            className="mr-2 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleSync(repoType)}
                            disabled={isLoading}
                        >
                            همگام‌سازی
                        </button>
                        <div className="mt-2 text-sm">
                            {updates[repoType].commits?.map((commit, index) => (
                                <div key={index} className="text-gray-600">{commit}</div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h5 className="text-lg font-medium text-gray-900">وضعیت به‌روزرسانی</h5>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCheckUpdates}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <svg className="animate-spin h-4 w-4 ml-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            بررسی...
                        </div>
                    ) : (
                        'بررسی تغییرات'
                    )}
                </button>
            </div>
            <div className="p-4">
                {error && (
                    <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}
                
                {updateStatus && (
                    <>
                        <div className="mb-4">
                            <span className="font-medium">آخرین بررسی: </span>
                            {new Date(updateStatus.updates.last_sync).toLocaleString('fa-IR')}
                        </div>
                        
                        <div className="mb-4">
                            <h6 className="text-base font-medium text-gray-900 mb-2">React پروژه</h6>
                            {renderUpdateInfo(updateStatus.updates, 'react')}
                        </div>

                        <div className="mb-4">
                            <h6 className="text-base font-medium text-gray-900 mb-2">PHP پروژه</h6>
                            {renderUpdateInfo(updateStatus.updates, 'php')}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GitUpdateChecker;
