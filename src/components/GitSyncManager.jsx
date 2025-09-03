import React from 'react';

const GitSyncManager = ({ projectType, repoUrl, branch, syncStatus, onCheckStatus, onSync, onPush, isLoading }) => {
    const projectTypeText = projectType === 'react' ? 'فرانت‌اند' : 'بک‌اند';
    
    return (
        <div className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800">همگام‌سازی پروژه {projectTypeText}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                        مخزن: {repoUrl || 'تنظیم نشده'} 
                        {branch && <span className="mr-1">({branch})</span>}
                    </p>
                </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button 
                    onClick={onCheckStatus} 
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 
                             transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                    {isLoading ? 'در حال بررسی...' : 'بررسی وضعیت'}
                </button>
                
                <button 
                    onClick={onSync} 
                    disabled={isLoading || !syncStatus.needsUpdate}
                    className="text-xs px-3 py-1.5 bg-green-500 text-white font-semibold rounded-md 
                             hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                             flex items-center gap-1"
                >
                    {isLoading ? 'در حال دریافت...' : 'دریافت تغییرات'}
                </button>
                
                <button 
                    onClick={onPush} 
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 bg-purple-500 text-white font-semibold rounded-md 
                             hover:bg-purple-600 transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                    {isLoading ? 'در حال ارسال...' : 'ارسال تغییرات'}
                </button>
            </div>

            {syncStatus.needsUpdate && (
                <p className="text-amber-600 text-xs mt-2 font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {syncStatus.behindCommits} کامیت از نسخه اصلی عقب‌تر است
                </p>
            )}

            {!syncStatus.needsUpdate && syncStatus.lastCommitDate && (
                <p className="text-green-600 text-xs mt-2 font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    پروژه به‌روز است
                </p>
            )}
        </div>
    );
};

export default GitSyncManager;
