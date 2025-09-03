import React, { useState, useEffect } from 'react';
import { HiDatabase, HiCheck, HiX, HiClock, HiUser, HiMail } from 'react-icons/hi';
import LocalGitService from '../services/localGitService';

const RepositoryStatus = ({ settings }) => {
    const [commitInfo, setCommitInfo] = useState({
        react: null,
        php: null
    });
    const [loading, setLoading] = useState(false);
    const [localGitInfo, setLocalGitInfo] = useState({
        installed: false,
        config: null,
        repoStatus: null
    });

    // بررسی وضعیت گیت محلی
    useEffect(() => {
        const checkLocalGit = async () => {
            try {
                const isInstalled = await LocalGitService.isGitInstalled();
                if (isInstalled) {
                    const [config, repoStatus] = await Promise.all([
                        LocalGitService.getGitConfig(),
                        LocalGitService.getRepositoryStatus()
                    ]);
                    setLocalGitInfo({
                        installed: true,
                        config,
                        repoStatus
                    });
                } else {
                    setLocalGitInfo(prev => ({ ...prev, installed: false }));
                }
            } catch (error) {
                console.error('Error checking local git:', error);
            }
        };

        checkLocalGit();
    }, []);

    // دریافت اطلاعات کامیت از سرور
    useEffect(() => {
        const fetchCommitInfo = async (type) => {
            try {
                const response = await fetch(`http://localhost/api/git_commit_info.php?type=${type}`);
                const data = await response.json();
                if (data.success) {
                    setCommitInfo(prev => ({
                        ...prev,
                        [type]: data.data
                    }));
                }
            } catch (error) {
                console.error(`Error fetching ${type} commit info:`, error);
            }
        };

        if (settings.company_react_repo) {
            fetchCommitInfo('react');
        }
        if (settings.company_php_repo) {
            fetchCommitInfo('php');
        }
    }, [settings.company_react_repo, settings.company_php_repo]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
                <HiDatabase className="text-2xl text-blue-600 mr-2" />
                <h2 className="text-xl font-bold">وضعیت مخازن</h2>
            </div>

            {/* اطلاعات گیت محلی */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">گیت محلی</h3>
                {localGitInfo.installed ? (
                    <div className="space-y-2">
                        {localGitInfo.config && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center text-sm">
                                    <HiUser className="text-gray-500 mr-2" />
                                    <span className="text-gray-600">نام کاربری: </span>
                                    <span className="font-medium mr-1">{localGitInfo.config.userName}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <HiMail className="text-gray-500 mr-2" />
                                    <span className="text-gray-600">ایمیل: </span>
                                    <span className="font-medium mr-1">{localGitInfo.config.userEmail}</span>
                                </div>
                            </div>
                        )}
                        {localGitInfo.repoStatus && (
                            <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center">
                                    <span className="text-gray-600 ml-2">شاخه فعلی:</span>
                                    <span className="font-medium">{localGitInfo.repoStatus.currentBranch}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-gray-600 ml-2">وضعیت تغییرات:</span>
                                    {localGitInfo.repoStatus.hasChanges ? (
                                        <span className="text-yellow-600 flex items-center">
                                            <HiClock className="mr-1" /> تغییرات ذخیره نشده
                                        </span>
                                    ) : (
                                        <span className="text-green-600 flex items-center">
                                            <HiCheck className="mr-1" /> همه تغییرات ذخیره شده‌اند
                                        </span>
                                    )}
                                </div>
                                {localGitInfo.repoStatus.lastCommit && (
                                    <div className="border-t pt-2 mt-2">
                                        <p className="font-medium mb-1">آخرین کامیت:</p>
                                        <div className="text-gray-600">
                                            <p>{localGitInfo.repoStatus.lastCommit.message}</p>
                                            <div className="flex items-center gap-2 mt-1 text-sm">
                                                <span>{localGitInfo.repoStatus.lastCommit.author}</span>
                                                <span>•</span>
                                                <span>{localGitInfo.repoStatus.lastCommit.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-red-600 flex items-center">
                        <HiX className="mr-1" />
                        <span>گیت روی سیستم نصب نشده است</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* React Repository */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">مخزن React</h3>
                    <div className="space-y-2">
                        <p className="text-sm">
                            <span className="font-medium ml-2">آدرس مخزن:</span>
                            <span className="text-gray-600">{settings.company_react_repo || 'تنظیم نشده'}</span>
                        </p>
                        <p className="text-sm">
                            <span className="font-medium ml-2">شاخه اصلی:</span>
                            <span className="text-gray-600">{settings.company_react_branch || 'main'}</span>
                        </p>
                        <div className="flex items-center">
                            <span className="font-medium ml-2">وضعیت:</span>
                            {settings.company_react_repo ? (
                                <span className="flex items-center text-green-600">
                                    <HiCheck className="mr-1" /> فعال
                                </span>
                            ) : (
                                <span className="flex items-center text-red-600">
                                    <HiX className="mr-1" /> غیرفعال
                                </span>
                            )}
                        </div>
                        {commitInfo.react && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">آخرین تغییرات</h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">{commitInfo.react.message}</p>
                                    <div className="flex items-center text-gray-500 gap-2">
                                        <HiClock className="text-gray-400" />
                                        <span>{formatDate(commitInfo.react.date)}</span>
                                        <span>•</span>
                                        <span>{commitInfo.react.author}</span>
                                    </div>
                                    <a 
                                        href={commitInfo.react.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-block mt-1"
                                    >
                                        مشاهده در گیت‌هاب
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* PHP Repository */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">مخزن PHP</h3>
                    <div className="space-y-2">
                        <p className="text-sm">
                            <span className="font-medium ml-2">آدرس مخزن:</span>
                            <span className="text-gray-600">{settings.company_php_repo || 'تنظیم نشده'}</span>
                        </p>
                        <p className="text-sm">
                            <span className="font-medium ml-2">شاخه اصلی:</span>
                            <span className="text-gray-600">{settings.company_php_branch || 'main'}</span>
                        </p>
                        <div className="flex items-center">
                            <span className="font-medium ml-2">وضعیت:</span>
                            {settings.company_php_repo ? (
                                <span className="flex items-center text-green-600">
                                    <HiCheck className="mr-1" /> فعال
                                </span>
                            ) : (
                                <span className="flex items-center text-red-600">
                                    <HiX className="mr-1" /> غیرفعال
                                </span>
                            )}
                        </div>
                        {commitInfo.php && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">آخرین تغییرات</h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">{commitInfo.php.message}</p>
                                    <div className="flex items-center text-gray-500 gap-2">
                                        <HiClock className="text-gray-400" />
                                        <span>{formatDate(commitInfo.php.date)}</span>
                                        <span>•</span>
                                        <span>{commitInfo.php.author}</span>
                                    </div>
                                    <a 
                                        href={commitInfo.php.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-block mt-1"
                                    >
                                        مشاهده در گیت‌هاب
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepositoryStatus;
