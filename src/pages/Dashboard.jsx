import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ProfilePage from "../components/profile/ProfilePage";
import { HiViewGrid, HiUserGroup, HiChartBar, HiCog } from 'react-icons/hi';

// --- کامپوننت برای نمایش یک پروژه مشتری ---
const CustomerProjectCard = ({ customer, token }) => {
    const [status, setStatus] = useState({ loading: false, message: '', needsUpdate: false });
    const [output, setOutput] = useState('');
    // جدید: State برای وضعیت اتصال به گیت
    const [connectionStatus, setConnectionStatus] = useState('checking'); // مقادیر ممکن: 'checking', 'connected', 'error'
    // جدید: State برای زمان آخرین به‌روزرسانی موفق
    const [lastUpdated, setLastUpdated] = useState(null);

    const runGitCommand = async (command, branch = 'main') => {
        setStatus({ loading: true, message: `در حال اجرای ${command}...`, needsUpdate: false });
        setOutput('');
        try {
            const response = await fetch("http://localhost/api/git_api.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ customer_id: customer.id, command, branch })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            // جدید: در اولین اجرای موفق، وضعیت اتصال را 'connected' قرار بده
            setConnectionStatus('connected');
            setOutput(result.output);

            if (command === 'status') {
                if (result.output.trim() === '') {
                    setStatus({ loading: false, message: 'پروژه به‌روز است.', needsUpdate: false });
                } else {
                    setStatus({ loading: false, message: 'تغییرات جدیدی در دسترس است!', needsUpdate: true });
                }
            } else if (command === 'pull') {
                // جدید: پس از pull موفق، زمان را ذخیره کن
                setLastUpdated(new Date());
                // وضعیت را دوباره بررسی کن تا پیام "پروژه به‌روز است" نمایش داده شود
                await runGitCommand('status', branch);
                setStatus(prev => ({...prev, message: 'تغییرات با موفقیت دریافت شد.'}));
            } else {
                 // برای دستورات دیگر مثل checkout
                await runGitCommand('status', branch);
                setStatus(prev => ({...prev, message: 'عملیات با موفقیت انجام شد.'}));
            }

        } catch (err) {
            // جدید: در صورت خطا، وضعیت اتصال را 'error' قرار بده
            setConnectionStatus('error');
            setStatus({ loading: false, message: `خطا: ${err.message}`, needsUpdate: false });
        }
    };

    // بررسی اولیه وضعیت هنگام بارگذاری کامپوننت
    useEffect(() => {
        runGitCommand('status');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 flex flex-col">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {/* جدید: نمایش دایره وضعیت اتصال */}
                    {connectionStatus === 'connected' && <span className="w-3 h-3 bg-green-500 rounded-full" title="اتصال به گیت موفق بود"></span>}
                    {connectionStatus === 'error' && <span className="w-3 h-3 bg-red-500 rounded-full" title="خطا در اتصال به گیت"></span>}
                    {connectionStatus === 'checking' && <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title="در حال بررسی اتصال..."></span>}
                    <h3 className="text-lg font-bold text-gray-800">{customer.company_name}</h3>
                </div>
                <Link to={`/admin/customers/edit/${customer.id}`} className="text-xs text-blue-600 hover:underline flex-shrink-0">مشاهده جزئیات</Link>
            </div>
            <p className="text-sm text-gray-500 mb-2">{customer.contact_person_name}</p>

            {/* جدید: نمایش زمان آخرین به‌روزرسانی */}
            {lastUpdated && (
                <p className="text-xs text-gray-500 mb-3">
                    آخرین دریافت تغییرات: {lastUpdated.toLocaleString('fa-IR')}
                </p>
            )}
            
            <div className="mb-2 text-sm">
                <span className="font-semibold">وضعیت پروژه:</span>
                <span className={`mr-2 font-bold ${status.needsUpdate ? 'text-yellow-600' : 'text-green-600'}`}>
                    {status.loading ? 'در حال بررسی...' : status.message}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                <button onClick={() => runGitCommand('status')} disabled={status.loading} className="bg-gray-600 text-white py-1 px-3 rounded-md text-sm hover:bg-gray-700 disabled:bg-gray-400">
                    بررسی مجدد
                </button>
                {status.needsUpdate && (
                    <button onClick={() => runGitCommand('pull')} disabled={status.loading} className="bg-purple-600 text-white py-1 px-3 rounded-md text-sm hover:bg-purple-700 disabled:bg-purple-400">
                        دریافت تغییرات (Pull)
                    </button>
                )}
                <button onClick={() => { const branch = prompt('نام شاخه (branch) مورد نظر را وارد کنید:', 'main'); if(branch) runGitCommand('checkout', branch); }} disabled={status.loading} className="bg-yellow-500 text-white py-1 px-3 rounded-md text-sm hover:bg-yellow-600 disabled:bg-yellow-300">
                    Checkout
                </button>
            </div>

            {output && (
                <pre className="mt-4 bg-gray-900 text-white p-2 rounded-md text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {output}
                </pre>
            )}
        </div>
    );
};


// --- کامپوننت اصلی صفحه داشبورد ---
const Dashboard = () => {
    const { token, user } = useSelector((state) => state.auth);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('projects');

    const tabs = [
        { id: 'projects', name: 'پروژه‌های فعال', icon: HiViewGrid },
        { id: 'analytics', name: 'گزارش‌ها و آمار', icon: HiChartBar },
        { id: 'settings', name: 'تنظیمات حساب', icon: HiCog },
    ];

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch("http://localhost/api/customers.php/customers", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'خطا در دریافت اطلاعات');
                // اطمینان از اینکه داده‌های دریافتی آرایه هستند
                const customers = Array.isArray(result.customers) ? result.customers : [];
                setCustomers(customers.filter(c => c.git_react_repo || c.git_php_repo));
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        if(token) fetchCustomers();
    }, [token]);

     

    const renderTabContent = () => {
        switch (activeTab) {
            case 'projects':
                if (isLoading) return <div className="p-10 text-center">در حال بارگذاری پروژه‌ها...</div>;
                if (error) return <div className="p-10 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;
                return (
                    <div className="space-y-6">
                        {customers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {customers.map(customer => (
                                    <CustomerProjectCard key={customer.id} customer={customer} token={token} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-white rounded-xl shadow-md p-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-6">
                                    <HiViewGrid className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">هیچ پروژه‌ای یافت نشد</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">برای شروع کار، لطفاً به بخش مدیریت مشتریان رفته و اطلاعات پروژه‌ها را تکمیل نمایید.</p>
                                <Link
                                    to="/admin/customers"
                                    className="inline-flex items-center mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    رفتن به مدیریت مشتریان
                                </Link>
                            </div>
                        )}
                    </div>
                );
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">وضعیت کلی پروژه‌ها</h2>
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                نمودارهای آماری به زودی اضافه خواهند شد...
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="bg-white rounded-xl shadow-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">تنظیمات حساب کاربری</h2>
                            <p className="mt-1 text-sm text-gray-500">اطلاعات حساب خود را مدیریت کنید</p>
                        </div>
                        <div className="p-6">
                            <ProfilePage />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // محاسبه آمار خلاصه
    const stats = {
        totalProjects: customers.length,
        activeProjects: customers.filter(c => !c.is_archived).length,
        needsUpdate: customers.filter(c => c.needs_update).length || 0,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">سامانه مدیریت پروژه‌ها</h1>
                            <p className="mt-1 text-sm text-gray-600">{user?.username} عزیز، به داشبورد خود خوش آمدید</p>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <button
                                onClick={() => setActiveTab('projects')}
                                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                مشاهده همه پروژه‌ها
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">کل پروژه‌ها</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <HiViewGrid className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">پروژه‌های فعال</p>
                                    <p className="mt-2 text-3xl font-bold text-green-600">{stats.activeProjects}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <HiChartBar className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">نیازمند به‌روزرسانی</p>
                                    <p className="mt-2 text-3xl font-bold text-orange-600">{stats.needsUpdate}</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <HiCog className="w-6 h-6 text-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                                            ${activeTab === tab.id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className={`
                                            -ml-1 ml-2 h-5 w-5
                                            ${activeTab === tab.id
                                                ? 'text-primary'
                                                : 'text-gray-400 group-hover:text-gray-500'
                                            }
                                        `}/>
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default Dashboard;
