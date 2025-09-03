import React from 'react';

const GitStatusDisplay = ({ gitStatus }) => {
    if (!gitStatus) return null;

    const { isInstalled, error, repoStatus } = gitStatus;

    if (error) {
        return (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="mr-3">
                        <h3 className="text-sm font-medium text-red-800">خطا در گیت</h3>
                        <div className="mt-1 text-sm text-red-700">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isInstalled) {
        return (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="mr-3">
                        <h3 className="text-sm font-medium text-yellow-800">گیت نصب نشده است</h3>
                        <p className="text-sm text-yellow-700">لطفاً گیت را نصب کنید و مطمئن شوید در PATH سیستم قرار دارد.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!repoStatus?.isRepo) {
        return (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="mr-3">
                        <div className="text-sm text-gray-700">این پوشه یک مخزن گیت نیست</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="space-y-2">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="mr-3">
                        <h3 className="text-sm font-medium text-green-800">مخزن گیت فعال است</h3>
                    </div>
                </div>
                {repoStatus.currentBranch && (
                    <div className="text-sm text-green-700">
                        <span className="font-medium">شاخه فعلی:</span> {repoStatus.currentBranch}
                    </div>
                )}
                {repoStatus.hasChanges && (
                    <div className="text-sm text-yellow-600">
                        تغییرات ذخیره نشده وجود دارد
                    </div>
                )}
                {repoStatus.lastCommit && (
                    <div className="text-sm text-green-700">
                        <div><span className="font-medium">آخرین کامیت:</span> {repoStatus.lastCommit.hash}</div>
                        <div className="text-xs text-green-600">{repoStatus.lastCommit.message}</div>
                        <div className="text-xs text-green-600">
                            توسط {repoStatus.lastCommit.author} در {repoStatus.lastCommit.date}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GitStatusDisplay;
