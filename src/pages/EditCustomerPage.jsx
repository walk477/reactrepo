import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'jalali-moment';
import { useGitOperations } from '../hooks/useGitOperations';

import CustomJalaliDatePicker from '../components/CustomJalaliDatePicker';
import ServerSettingsTab from '../components/ServerSettingsTab';
import GitSettingsTab from '../components/GitSettingsTab';
import LocalSettingsTab from '../components/LocalSettingsTab';
import TabButton from '../components/TabButton';

// --- کامپوننت اصلی صفحه ویرایش مشتری ---
const EditCustomerPage = () => {
    const { customerId } = useParams();
    const token = useSelector(state => state.auth.token);
    
    const [activeTab, setActiveTab] = useState('server');
    const [formData, setFormData] = useState({
        company_name: '', contact_person_name: '', contract_end_date: '',
        customer_type: 'normal', deployment_type: 'server', server_ip: '',
        server_port: 22, server_username: '', server_password: '', app_folder_path: '',
        git_react_repo: '', git_php_repo: '', git_username: '', git_access_token: '',
        git_ssh_key: '', git_ssh_key_public: '', react_branch: 'main', php_branch: 'main',
        project_server_path: '', git_react_repo_ssh: '', git_php_repo_ssh: '',
        preferred_connection: 'https', local_ip: '', local_project_path: ''
    });
    
    const [contractDate, setContractDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // State for connection testing
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState({ type: '', message: '' });

    // States for Git management
    const [gitOutput, setGitOutput] = useState('');
    const [gitStatus, setGitStatus] = useState({
        reactStatus: { needsUpdate: false, behindCommits: 0, lastCommitDate: null },
        phpStatus: { needsUpdate: false, behindCommits: 0, lastCommitDate: null }
    });

    // استفاده از هوک GitOperations
    const { isLoading: isGitLoading, error: gitError, checkRepositoryStatus, updateRepository } = useGitOperations();

    useEffect(() => {
        const fetchCustomer = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost/api/customers.php/customers/${customerId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok && result.customer) {
                    const customerData = result.customer;
                    setFormData(prev => ({...prev, ...customerData}));
                    if (customerData.contract_end_date) {
                        setContractDate(moment(customerData.contract_end_date, 'YYYY-MM-DD').toDate());
                    }
                    // Set the active tab based on saved customer data
                    setActiveTab(customerData.deployment_type || 'server');
                } else {
                    throw new Error(result.error || 'خطا در دریافت اطلاعات مشتری');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomer();
    }, [customerId, token]);

    useEffect(() => {
        console.log("formData state has changed:", formData);
    }, [formData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateChange = useCallback((date) => {
        setContractDate(date);
        setFormData(prev => ({ ...prev, contract_end_date: date ? moment(date).format('YYYY-MM-DD') : '' }));
    }, []);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setFormData(prev => ({...prev, deployment_type: tabName}));
        setTestResult({ type: '', message: '' }); // Clear test results on tab change
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult({ type: '', message: '' });
        setGitOutput('');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Simulate API call for testing
            if (activeTab === 'server' && (!formData.server_ip || !formData.server_username)) throw new Error("IP و نام کاربری سرور الزامی است.");
            if (activeTab === 'git' && !formData.git_react_repo && !formData.git_react_repo_ssh) throw new Error("آدرس مخزن گیت الزامی است.");
            if (activeTab === 'local' && !formData.local_ip) throw new Error("آدرس IP سیستم شخصی الزامی است.");

            setTestResult({ type: 'success', message: 'اتصال با موفقیت برقرار شد.' });
        } catch (err) {
            setTestResult({ type: 'error', message: err.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`http://localhost/api/customers.php/customers/${customerId}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(result.message || 'اطلاعات مشتری با موفقیت به‌روز شد');
            } else {
                throw new Error(result.error || 'خطا در ویرایش مشتری');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Git functionality ---
    const handleCheckStatus = async (type) => {
        // 1. ساخت آبجکت داده‌ها بر اساس اطلاعات موجود در state
        const dataToSend = {
            customerId,
            projectType: type,
            customerRepoUrl: type === 'react' ? formData.git_react_repo : formData.git_php_repo,
            customerBranch: type === 'react' ? formData.react_branch : formData.php_branch,
            serverIp: formData.server_ip,
            serverUsername: formData.server_username,
            projectPath: formData.project_server_path,
            connectionMethod: formData.preferred_connection,
            gitUsername: formData.git_username,
            gitAccessToken: formData.git_access_token,
            companyRepoUrl: 'https://github.com/your-company/template-repo.git' // آدرس مخزن مرجع شرکت
            // ... اضافه کردن هر فیلد دیگری که سرور نیاز دارد
        };

        // 2. لاگ کردن آبجکت برای دیباگ (مهم‌ترین بخش)
        console.log("DEBUG: Data being sent directly from component:", dataToSend);

        try {
            // 3. ارسال درخواست fetch
            const response = await fetch('http://localhost/api/git_status_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            // 4. بررسی پاسخ و مدیریت خطا
            if (!response.ok) {
                // اگر سرور خطا برگرداند (مثل 400 یا 500)
                throw new Error(result.error || 'خطای ناشناخته از سرور');
            }

            // 5. آپدیت کردن state با نتیجه موفقیت‌آمیز
            setGitStatus(prev => ({
                ...prev,
                [`${type}Status`]: result.status
            }));
            // می‌توانید یک پیام موفقیت هم نمایش دهید
            // setSuccessMessage("وضعیت با موفقیت بررسی شد.");

        } catch (error) {
            console.error('Error checking repository status:', error);
            // نمایش خطا به کاربر
            setError(error.message);
        }
    };

    const handleSync = async (type) => {
        try {
            await updateRepository({ 
                customerId, 
                projectType: type,
                operation: 'pull'
            });
            // After successful sync, refresh the status
            await handleCheckStatus(type);
        } catch (error) {
            console.error('Error syncing repository:', error);
        }
    };

    const handleGitPush = async (type) => {
    // تنظیم کردن state برای نمایش وضعیت "در حال بارگذاری"
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    setGitOutput(`در حال اجرای عملیات راه‌اندازی اولیه برای پروژه ${type}...`);

    try {
        // ۱. ساخت آبجکت داده‌ها برای ارسال به API راه‌اندازی اولیه
        const dataToSend = {
            customerId,
            projectType: type,
        };

        // ۲. لاگ کردن آبجکت برای دیباگ
        console.log("DEBUG: Sending data for PUSH (Initial Setup) operation:", dataToSend);

        // ۳. ارسال درخواست fetch به API مخصوص راه‌اندازی اولیه
        const response = await fetch('http://localhost/api/git_push_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();

        // ۴. مدیریت پاسخ سرور
        if (!response.ok) {
            throw new Error(result.error || 'خطا در عملیات راه‌اندازی اولیه پروژه');
        }

        // ۵. نمایش پیام موفقیت و به‌روزرسانی وضعیت
        setSuccessMessage(result.message || `راه‌اندازی اولیه پروژه ${type} با موفقیت انجام شد.`);
        setGitOutput(prev => `${prev}\n${result.message || 'عملیات با موفقیت کامل شد.'}`);
        
        // وضعیت مخزن را دوباره چک می‌کنیم تا UI به‌روز شود
        await handleCheckStatus(type);

    } catch (err) {
        setError(`خطا در راه‌اندازی پروژه ${type}: ${err.message}`);
        setGitOutput(prev => `${prev}\nخطا: ${err.message}`);
    } finally {
        // بازگرداندن دکمه به حالت اولیه
        setIsSubmitting(false);
    }
};

    const TestConnectionSection = () => (
        <div className="mt-6 pt-4 border-t">
            <h3 className="text-md font-semibold text-gray-700 mb-3">تست اتصال</h3>
            <button type="button" onClick={handleTestConnection} disabled={isTesting}
                className="bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isTesting && ( <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> )}
                {isTesting ? 'در حال تست...' : `تست اتصال`}
            </button>
            {testResult.message && (
                <p className={`mt-3 text-sm font-medium ${testResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.message}
                </p>
            )}
        </div>
    );
    
    if (isLoading) return <div className="p-10 text-center">در حال بارگذاری...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl" dir="rtl">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ویرایش مشتری</h1>
                    <p className="text-gray-500 mt-1">{formData.company_name}</p>
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

                {/* اطلاعات اصلی */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-3">اطلاعات اصلی</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شرکت</label>
                            <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} required className="mt-1 block w-full input"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شخص رابط</label>
                            <input type="text" name="contact_person_name" value={formData.contact_person_name || ''} onChange={handleChange} className="mt-1 block w-full input"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نوع مشتری</label>
                            <select name="customer_type" value={formData.customer_type || 'normal'} onChange={handleChange} className="mt-1 block w-full input bg-white">
                                <option value="normal">عادی</option>
                                <option value="golden">طلایی</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تاریخ پایان قرارداد</label>
                            <CustomJalaliDatePicker selectedDate={contractDate} onChange={handleDateChange} />
                        </div>
                    </div>
                </div>
                
                {/* انتخاب نوع استقرار */}
                 <div>
                     <h2 className="text-xl font-semibold text-gray-700 border-b pb-3">تنظیمات استقرار پروژه</h2>
                     <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mt-4">
                        <TabButton 
                            active={activeTab === 'server'} 
                            onClick={() => handleTabChange('server')}
                        >
                            سرور / هاست
                        </TabButton>
                        <TabButton 
                            active={activeTab === 'git'} 
                            onClick={() => handleTabChange('git')}
                        >
                            مخزن گیت
                        </TabButton>
                        <TabButton 
                            active={activeTab === 'local'} 
                            onClick={() => handleTabChange('local')}
                        >
                            سیستم شخصی
                        </TabButton>
                     </div>
                </div>

                {/* ========= TABS CONTENT ========= */}
                <div className="pt-4 animate-fade-in">
                    {activeTab === 'server' && (
                        <ServerSettingsTab 
                            formData={formData}
                            handleChange={handleChange}
                            onTest={handleTestConnection}
                            isTesting={isTesting}
                            testResult={testResult}
                        />
                    )}

                    {activeTab === 'git' && (
                        <GitSettingsTab 
                            formData={formData}
                            handleChange={handleChange} // <-- این خط را اضافه یا اصلاح کنید
                            gitOutput={gitOutput}
                            gitStatus={gitStatus}
                            isGitLoading={isGitLoading}
                            handleCheckStatus={handleCheckStatus}
                            handleSync={handleSync}
                            handleGitPush={handleGitPush}
                            customerId={customerId}
                            initialSetup={!formData.git_react_repo && !formData.git_php_repo}
                        />
                    )}
                    
                    {activeTab === 'local' && (
                        <LocalSettingsTab 
                            formData={formData}
                            handleChange={handleChange}
                            onTest={handleTestConnection}
                            isTesting={isTesting}
                            testResult={testResult}
                        />
                    )}
                </div>

                {/* دکمه‌های فرم */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md">انصراف</a>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50">
                        {isSubmitting && ( <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> )}
                        {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </button>
                </div>
            </form>
             <style>{`
                .input {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    width: 100%;
                    transition: box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out;
                }
                .input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default EditCustomerPage;

