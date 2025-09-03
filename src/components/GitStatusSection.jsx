import React from 'react';
import { HiUser, HiMail, HiCodeBranch, HiDatabase } from 'react-icons/hi';

const GitStatusSection = ({ gitStatus }) => {
    if (!gitStatus) return null;

    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">گیت محلی</h3>
            {gitStatus.isInstalled ? (
                <div className="space-y-2">
                    {gitStatus.repoStatus && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center text-sm">
                                    <HiUser className="text-gray-500 mr-2" />
                                    <span className="text-gray-600">وضعیت مخزن: </span>
                                    <span className="font-medium mr-1">{gitStatus.repoStatus.isRepo ? 'فعال' : 'غیرفعال'}</span>
                                </div>
                                {gitStatus.repoStatus.currentBranch && (
                                    <div className="flex items-center text-sm">
                                        <HiCodeBranch className="text-gray-500 mr-2" />
                                        <span className="text-gray-600">شاخه فعلی: </span>
                                        <span className="font-medium mr-1">{gitStatus.repoStatus.currentBranch}</span>
                                    </div>
                                )}
                            </div>

                            {gitStatus.repoStatus.isRepo && (
                                <div className="mt-4">
                                    {gitStatus.repoStatus.hasChanges && (
                                        <div className="text-yellow-600 text-sm flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            تغییرات ذخیره نشده وجود دارد
                                        </div>
                                    )}

                                    {gitStatus.repoStatus.lastCommit && (
                                        <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">آخرین کامیت:</h4>
                                            <p className="text-sm text-gray-600">{gitStatus.repoStatus.lastCommit.message}</p>
                                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                                <span>{gitStatus.repoStatus.lastCommit.author}</span>
                                                <span className="mx-2">•</span>
                                                <span>{gitStatus.repoStatus.lastCommit.date}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="text-yellow-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {gitStatus.error || 'گیت روی سیستم نصب نشده است'}
                </div>
            )}
        </div>
    );
};

export default GitStatusSection;
