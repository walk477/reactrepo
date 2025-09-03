import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSettings } from '../context/SettingsContext';
import { 
    HiColorSwatch, 
    HiCog, 
    HiGlobe, 
    HiTemplate, 
    HiUser, 
    HiRefresh, 
    HiCheck, 
    HiX,
    HiPhotograph,
    HiAdjustments,
    HiDatabase,
    HiClock,
    HiMail,
} from 'react-icons/hi';
import RepositoryStatus from '../components/RepositoryStatus';

import GitAccessChecker from '../components/GitAccessChecker';


const SettingsPage = () => {
    // --- Hooks & State Management ---
    const { user, token } = useSelector((state) => state.auth);
    const { refetchSettings } = useSettings(); // تابع برای به‌روزرسانی آنی تم
    const isAdmin = user?.role_id === 1;

    // State های مربوط به UI
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState({ global: false, user: false });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // State های مربوط به تنظیمات
    const [globalSettings, setGlobalSettings] = useState({ 
        site_title: '', 
        logo_url: '', 
        font_family: '', 
        primary_color: '', 
        text_color: '',
        company_react_repo: '',
        company_php_repo: '',
        company_react_branch: 'main',
        company_php_branch: 'main',
        github_access_token: '',
        github_webhook_secret: ''
    });

    const [userSettings, setUserSettings] = useState({ 
        font_family: '', 
        primary_color: '', 
        text_color: '' 
    });

    // State های مربوط به گیت
    const [localGitInfo, setLocalGitInfo] = useState({
        installed: false,
        config: null,
        repoStatus: null
    });

    const [gitAccessStatus, setGitAccessStatus] = useState({
        react: null,
        php: null
    });

    // State های مربوط به لوگو
    const [logoFile, setLogoFile] = useState(null);
    const [previewLogo, setPreviewLogo] = useState('');

    // بررسی وضعیت گیت محلی و دسترسی به مخازن
    // بررسی نصب بودن گیت و دسترسی به مخازن
    useEffect(() => {
        const checkGitStatus = async () => {
            // فقط برای کاربران ادمین
            if (!isAdmin) return;

            try {
                // بررسی نصب بودن گیت
                const gitResponse = await fetch('http://localhost/api/git_local_info.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ check_installation: true })
                });

                const gitData = await gitResponse.json();
                setLocalGitInfo(prev => ({
                    ...prev,
                    installed: gitData.success && gitData.data?.installed
                }));

                // اگر گیت نصب نیست یا توکن گیت‌هاب وجود ندارد، بررسی دسترسی به مخازن را انجام نمی‌دهیم
                if (!gitData.success || !gitData.data?.installed || !globalSettings.github_access_token) {
                    return;
                }

                // بررسی دسترسی به مخازن شرکت
                const checkRepoAccess = async (repoUrl, type) => {
                    if (!repoUrl) return;

                    try {
                        const response = await fetch('http://localhost/api/git_local_info.php', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: globalSettings.github_access_token,
                                repoUrl: repoUrl
                            })
                        });

                        const data = await response.json();
                        setGitAccessStatus(prev => ({
                            ...prev,
                            [type]: {
                                success: data.success,
                                hasAccess: data.success ? data.data?.hasAccess : false,
                                error: data.success ? null : data.error
                            }
                        }));
                    } catch (error) {
                        setGitAccessStatus(prev => ({
                            ...prev,
                            [type]: {
                                success: false,
                                hasAccess: false,
                                error: error.message
                            }
                        }));
                    }
                };

                // بررسی همزمان هر دو مخزن
                await Promise.all([
                    checkRepoAccess(globalSettings.company_react_repo, 'react'),
                    checkRepoAccess(globalSettings.company_php_repo, 'php')
                ]);

            } catch (error) {
                console.error('Error checking git status:', error);
                setLocalGitInfo(prev => ({ ...prev, installed: false }));
                setGitAccessStatus({
                    react: { success: false, error: error.message },
                    php: { success: false, error: error.message }
                });
            }
        };

        checkGitStatus();
    }, [isAdmin, token, globalSettings.github_access_token, globalSettings.company_react_repo, globalSettings.company_php_repo]);



    // --- Data Fetching ---
    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError('برای دسترسی به این صفحه باید وارد شوید.');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // دریافت همزمان تنظیمات شخصی و عمومی
                const [userSettingsRes, globalSettingsRes] = await Promise.all([
                    fetch("http://localhost/api/users.php/users/settings", { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch("http://localhost/api/users.php/settings", { headers: { "Authorization": `Bearer ${token}` } }) // ادمین به این دسترسی دارد
                ]);

                const userData = await userSettingsRes.json();
                if (userSettingsRes.ok) {
                    setUserSettings(userData);
                } else {
                    throw new Error(userData.error || 'خطا در دریافت تنظیمات شخصی');
                }

                const globalData = await globalSettingsRes.json();
                if (globalSettingsRes.ok) {
                    setGlobalSettings(globalData);
                    setPreviewLogo(globalData.logo_url || '');
                } else {
                    // اگر کد خطا 403 باشد و کاربر ادمین نباشد، خطا را نادیده می‌گیریم
                    if (globalSettingsRes.status === 403 && !isAdmin) {
                        return;
                    }
                    // در غیر این صورت، خطا را نمایش می‌دهیم
                    throw new Error(globalData.error || 'خطا در دریافت تنظیمات عمومی');
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [token, isAdmin]);

    // --- Event Handlers ---
    const handleGlobalChange = (e) => setGlobalSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUserChange = (e) => setUserSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    // --- API Submission ---
    const handleGlobalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(prev => ({ ...prev, global: true }));
        setError(''); setSuccessMessage('');

        const formData = new FormData();
        Object.keys(globalSettings).forEach(key => {
            if (key !== 'logo_url' && key !== 'id') {
                formData.append(key, globalSettings[key]);
            }
        });
        if (logoFile) formData.append('logo_file', logoFile);

        try {
            const response = await fetch("http://localhost/api/users.php/settings", {
                method: 'POST',
                headers: { 
                    "Authorization": `Bearer ${token}`
                    // Content-Type will be automatically set by the browser for FormData
                },
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(result.message);
                refetchSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(prev => ({ ...prev, global: false }));
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        await saveUserSettings(userSettings);
    };

    /**
     * ✅ بازنویسی شده: تابع برای بازنشانی تنظیمات شخصی به حالت پیش‌فرض
     */
    const handleResetUserSettings = async () => {
        // ۱. مقادیر خالی را برای ارسال به سرور آماده کن
        const resetPayload = { font_family: '', primary_color: '', text_color: '' };
        
        // ۲. UI را با مقادیر تنظیمات عمومی (که از قبل دریافت شده) به‌روز کن
        setUserSettings({
            font_family: globalSettings.font_family || '',
            primary_color: globalSettings.primary_color || '#FFFFFF',
            text_color: globalSettings.text_color || '#FFFFFF'
        });

        // ۳. مقادیر خالی را به سرور بفرست تا تنظیمات شخصی کاربر پاک شود
        await saveUserSettings(resetPayload, "تنظیمات شما به حالت پیش‌فرض بازنشانی شد.");
    };

    // تابع کمکی برای ذخیره تنظیمات شخصی
    const saveUserSettings = async (settingsData, successMsg = 'تنظیمات شما با موفقیت ذخیره شد.') => {
        setIsSubmitting(prev => ({ ...prev, user: true }));
        setError(''); setSuccessMessage('');
        try {
            const response = await fetch("http://localhost/api/users.php/users/settings", {
                method: 'PUT',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(settingsData)
            });
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(successMsg);
                refetchSettings();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(prev => ({ ...prev, user: false }));
        }
    };


    // --- GitHub Access Handlers ---
    const handleReactRepoAccessChecked = (result) => {
        setGitAccessStatus(prev => ({
            ...prev,
            react: result
        }));
    };

    const handlePhpRepoAccessChecked = (result) => {
        setGitAccessStatus(prev => ({
            ...prev,
            php: result
        }));
    };

    // --- Render Logic ---
    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-500">در حال بارگذاری تنظیمات...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* هدر صفحه */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <HiAdjustments className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h1>
                                <p className="mt-1 text-gray-500">تنظیمات شخصی و عمومی سیستم را از اینجا مدیریت کنید</p>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                <span>وضعیت اتصال:</span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-green-600">متصل</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* نمایش وضعیت مخازن */}
                {isAdmin && (
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
                                    {/* نمایش اطلاعات کانفیگ گیت */}
                                    {localGitInfo.config && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center text-sm">
                                                <HiUser className="text-gray-500 mr-2" />
                                                <span className="text-gray-600">نام کاربری: </span>
                                                <span className="font-medium mr-1">{localGitInfo.config.userName || 'تنظیم نشده'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <HiMail className="text-gray-500 mr-2" />
                                                <span className="text-gray-600">ایمیل: </span>
                                                <span className="font-medium mr-1">{localGitInfo.config.userEmail || 'تنظیم نشده'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* نمایش وضعیت مخزن */}
                                    {localGitInfo.repoStatus && (
                                        <div className="mt-3 space-y-2 text-sm">
                                            {localGitInfo.repoStatus.isRepo ? (
                                                <>
                                                    {localGitInfo.repoStatus.currentBranch && (
                                                        <div className="flex items-center">
                                                            <span className="text-gray-600 ml-2">شاخه فعلی:</span>
                                                            <span className="font-medium">{localGitInfo.repoStatus.currentBranch}</span>
                                                        </div>
                                                    )}
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
                                                    {localGitInfo.repoStatus.initialRepo ? (
                                                        <div className="text-blue-600">
                                                            <span>مخزن تازه ایجاد شده - هنوز کامیتی ثبت نشده است</span>
                                                        </div>
                                                    ) : localGitInfo.repoStatus.lastCommit && (
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
                                                </>
                                            ) : (
                                                <div className="text-yellow-600 flex items-center">
                                                    <HiX className="mr-1" />
                                                    <span>این پوشه یک مخزن گیت نیست</span>
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
                        
                        {/* نمایش مخازن شرکت */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* React Repository */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-2">مخزن React</h3>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="font-medium ml-2">آدرس مخزن:</span>
                                        <span className="text-gray-600">{globalSettings.company_react_repo || 'تنظیم نشده'}</span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium ml-2">شاخه اصلی:</span>
                                        <span className="text-gray-600">{globalSettings.company_react_branch || 'main'}</span>
                                    </p>
                                    <div className="flex items-center">
                                        <span className="font-medium ml-2">وضعیت:</span>
                                        {globalSettings.company_react_repo ? (
                                            <span className="flex items-center text-green-600">
                                                <HiCheck className="mr-1" /> فعال
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-red-600">
                                                <HiX className="mr-1" /> غیرفعال
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PHP Repository */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-2">مخزن PHP</h3>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="font-medium ml-2">آدرس مخزن:</span>
                                        <span className="text-gray-600">{globalSettings.company_php_repo || 'تنظیم نشده'}</span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium ml-2">شاخه اصلی:</span>
                                        <span className="text-gray-600">{globalSettings.company_php_branch || 'main'}</span>
                                    </p>
                                    <div className="flex items-center">
                                        <span className="font-medium ml-2">وضعیت:</span>
                                        {globalSettings.company_php_repo ? (
                                            <span className="flex items-center text-green-600">
                                                <HiCheck className="mr-1" /> فعال
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-red-600">
                                                <HiX className="mr-1" /> غیرفعال
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* بخش تنظیمات شخصی */}
                <form onSubmit={handleUserSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <HiUser className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">تنظیمات شخصی</h2>
                                    <p className="text-sm text-gray-500">تنظیمات اختصاصی شما که بر تنظیمات عمومی اولویت دارد</p>
                                </div>
                            </div>
                        </div>
                    </div>

                <div className="p-6 space-y-6">
                    {successMessage && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 p-4 rounded-lg">
                            <HiCheck className="w-5 h-5 flex-shrink-0" />
                            <p>{successMessage}</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 p-4 rounded-lg">
                            <HiX className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">فونت دلخواه</label>
                            <div className="relative">
                                <select
                                    name="font_family"
                                    value={userSettings.font_family || ''}
                                    onChange={handleUserChange}
                                    className="block w-full pr-10 py-3 text-gray-700 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                >
                                    <option value="">استفاده از فونت پیش‌فرض سایت</option>
                                    <option value="Vazirmatn">وزیرمتن</option>
                                    <option value="IRANSans">ایران سنس</option>
                                    <option value="Sahel">ساحل</option>
                                </select>
                                <HiTemplate className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رنگ اصلی</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <HiColorSwatch className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="color"
                                        name="primary_color"
                                        value={userSettings.primary_color || '#FFFFFF'}
                                        onChange={handleUserChange}
                                        className="w-12 h-12 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600 font-mono">{userSettings.primary_color || '#FFFFFF'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رنگ متن</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <HiColorSwatch className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="color"
                                        name="text_color"
                                        value={userSettings.text_color || '#FFFFFF'}
                                        onChange={handleUserChange}
                                        className="w-12 h-12 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600 font-mono">{userSettings.text_color || '#FFFFFF'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting.user}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50"
                        >
                            <HiCheck className="w-5 h-5" />
                            {isSubmitting.user ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                        </button>
                        <button
                            type="button"
                            onClick={handleResetUserSettings}
                            disabled={isSubmitting.user}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-600/20 transition-all duration-200 disabled:opacity-50"
                        >
                            <HiRefresh className="w-5 h-5" />
                            بازنشانی به پیش‌فرض
                        </button>
                    </div>
                </div>
            </form>

            {/* بخش تنظیمات عمومی (فقط برای ادمین) */}
            {isAdmin && (
                <form onSubmit={handleGlobalSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 p-6">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <HiGlobe className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">تنظیمات عمومی سایت</h2>
                                <p className="text-sm text-gray-500">تنظیمات پایه‌ای سیستم که برای همه کاربران اعمال می‌شود</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* بخش تنظیمات مخازن گیت شرکت */}
                        <div className="border-b border-gray-100 pb-6">
                            <div className="flex items-center space-x-4 space-x-reverse mb-6">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <HiTemplate className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">تنظیمات مخازن گیت شرکت</h3>
                                    <p className="text-sm text-gray-500">آدرس مخازن گیت پروژه‌های شرکت برای مقایسه با پروژه‌های مشتریان</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        آدرس مخزن React شرکت
                                    </label>
                                    <input
                                        type="text"
                                        name="company_react_repo"
                                        value={globalSettings.company_react_repo || ''}
                                        onChange={handleGlobalChange}
                                        placeholder="مثال: https://github.com/company/react-project.git"
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                    />
                                    {globalSettings.github_access_token && globalSettings.company_react_repo && (
                                        <div className="mt-2">
                                            <GitAccessChecker
                                                token={globalSettings.github_access_token}
                                                repoUrl={globalSettings.company_react_repo}
                                                onAccessChecked={handleReactRepoAccessChecked}
                                            />
                                            {gitAccessStatus.react && (
                                                <div className={`mt-2 text-sm ${gitAccessStatus.react.success ? 'text-green-600' : 'text-red-600'}`}>
                                                    {gitAccessStatus.react.success ? 
                                                        'دسترسی به مخزن تایید شد' : 
                                                        `خطا: ${gitAccessStatus.react.error}`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            شاخه اصلی React
                                        </label>
                                        <input
                                            type="text"
                                            name="company_react_branch"
                                            value={globalSettings.company_react_branch || 'main'}
                                            onChange={handleGlobalChange}
                                            placeholder="main"
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        آدرس مخزن PHP شرکت
                                    </label>
                                    <input
                                        type="text"
                                        name="company_php_repo"
                                        value={globalSettings.company_php_repo || ''}
                                        onChange={handleGlobalChange}
                                        placeholder="مثال: https://github.com/company/php-project.git"
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                    />
                                    {globalSettings.github_access_token && globalSettings.company_php_repo && (
                                        <div className="mt-2">
                                            <GitAccessChecker
                                                token={globalSettings.github_access_token}
                                                repoUrl={globalSettings.company_php_repo}
                                                onAccessChecked={handlePhpRepoAccessChecked}
                                            />
                                            {gitAccessStatus.php && (
                                                <div className={`mt-2 text-sm ${gitAccessStatus.php.success ? 'text-green-600' : 'text-red-600'}`}>
                                                    {gitAccessStatus.php.success ? 
                                                        'دسترسی به مخزن تایید شد' : 
                                                        `خطا: ${gitAccessStatus.php.error}`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            شاخه اصلی PHP
                                        </label>
                                        <input
                                            type="text"
                                            name="company_php_branch"
                                            value={globalSettings.company_php_branch || 'main'}
                                            onChange={handleGlobalChange}
                                            placeholder="main"
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* بخش تنظیمات GitHub */}
                            <div className="mt-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        GitHub Access Token
                                    </label>
                                    <input
                                        type="password"
                                        name="github_access_token"
                                        value={globalSettings.github_access_token || ''}
                                        onChange={handleGlobalChange}
                                        placeholder="توکن دسترسی GitHub را وارد کنید"
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        برای دسترسی به ریپوزیتوری‌ها نیاز به یک Personal Access Token از GitHub دارید
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook Secret
                                    </label>
                                    <input
                                        type="password"
                                        name="github_webhook_secret"
                                        value={globalSettings.github_webhook_secret || ''}
                                        onChange={handleGlobalChange}
                                        placeholder="کلید رمز Webhook را وارد کنید"
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        این کلید برای تأیید Webhook‌های دریافتی از GitHub استفاده می‌شود
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">عنوان سایت</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="site_title"
                                            value={globalSettings.site_title || ''}
                                            onChange={handleGlobalChange}
                                            className="block w-full pr-10 py-3 text-gray-700 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                            placeholder="عنوان سایت را وارد کنید..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">فونت پیش‌فرض سایت</label>
                                    <div className="relative">
                                        <select
                                            name="font_family"
                                            value={globalSettings.font_family || 'Vazirmatn'}
                                            onChange={handleGlobalChange}
                                            className="block w-full pr-10 py-3 text-gray-700 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                        >
                                            <option value="Vazirmatn">وزیرمتن</option>
                                            <option value="IRANSans">ایران سنس</option>
                                            <option value="Sahel">ساحل</option>
                                        </select>
                                        <HiTemplate className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700">رنگ‌بندی پیش‌فرض سایت</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-2">رنگ اصلی سایت</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <HiColorSwatch className="w-5 h-5 text-gray-400" />
                                                <input
                                                    type="color"
                                                    name="primary_color"
                                                    value={globalSettings.primary_color || '#203961'}
                                                    onChange={handleGlobalChange}
                                                    className="w-12 h-12 rounded-lg cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600 font-mono">{globalSettings.primary_color || '#203961'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-2">رنگ متن</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <HiColorSwatch className="w-5 h-5 text-gray-400" />
                                                <input
                                                    type="color"
                                                    name="text_color"
                                                    value={globalSettings.text_color || '#333333'}
                                                    onChange={handleGlobalChange}
                                                    className="w-12 h-12 rounded-lg cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600 font-mono">{globalSettings.text_color || '#333333'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">لوگوی سایت</label>
                                <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                                    <img
                                        src={previewLogo.startsWith('blob:') ? previewLogo : `http://localhost${previewLogo}`}
                                        alt="Logo Preview"
                                        className="h-32 object-contain mb-6 rounded-lg shadow-sm"
                                    />
                                    <label className="cursor-pointer group">
                                        <div className="mt-2 flex flex-col items-center">
                                            <HiPhotograph className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                                            <span className="mt-2 block text-sm font-medium text-gray-600">
                                                انتخاب تصویر جدید
                                            </span>
                                            <input
                                                type="file"
                                                name="logo_file"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <span className="mt-1 text-xs text-gray-500">یا فایل را اینجا رها کنید</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 p-6 bg-gray-50">
                        <button
                            type="submit"
                            disabled={isSubmitting.global}
                            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-600/20 transition-all duration-200 disabled:opacity-50"
                        >
                            <HiCheck className="w-5 h-5" />
                            {isSubmitting.global ? 'در حال ذخیره تنظیمات...' : 'ذخیره تنظیمات عمومی'}
                        </button>
                    </div>
                </form>
            )}
            </div>
        </div>
    );
};

export default SettingsPage;
