import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import moment from 'jalali-moment';

// ====================================================================
// --- Import Components ---
// ====================================================================
import GitUpdateChecker from '../components/GitUpdateChecker';

// ====================================================================
// --- کامپوننت تقویم شمسی سفارشی، زیبا و بی‌نقص ---
// ====================================================================
const CustomJalaliDatePicker = ({ selectedDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('days');
    const [viewDate, setViewDate] = useState(moment());
    const pickerRef = useRef(null);

    const JALALI_MONTHS = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    useEffect(() => {
        if (selectedDate && moment(selectedDate).isValid()) {
            setViewDate(moment(selectedDate));
        }
    }, [selectedDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMonthNav = (amount) => setViewDate(prev => prev.clone().add(amount, 'jMonth'));
    const handleYearNav = (amount) => setViewDate(prev => prev.clone().add(amount, 'jYear'));

    const handleDayClick = (day) => {
        const newDate = viewDate.clone().jDate(day);
        onChange(newDate.toDate());
        setIsOpen(false);
    };

    const handleMonthClick = (monthIndex) => {
        setViewDate(prev => prev.clone().jMonth(monthIndex));
        setView('days');
    };

    const handleYearClick = (year) => {
        setViewDate(prev => prev.clone().jYear(year));
        setView('months');
    };

    const renderDays = () => {
        const daysInMonth = viewDate.jDaysInMonth();
        const startOffset = (viewDate.clone().startOf('jMonth').day() + 1) % 7;
        const days = Array.from({ length: startOffset }, (_, i) => <div key={`empty-${i}`} />);
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = viewDate.clone().jDate(day);
            const isSelected = selectedDate && currentDate.isSame(selectedDate, 'day');
            const isToday = currentDate.isSame(moment(), 'day');
            days.push(
                <button type="button" key={day} onClick={() => handleDayClick(day)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-sm ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-100'} ${!isSelected && isToday ? 'border-2 border-blue-500' : ''}`}>
                    {day}
                </button>
            );
        }
        return days;
    };

    const renderMonths = () => JALALI_MONTHS.map((month, index) => <button type="button" key={month} onClick={() => handleMonthClick(index)} className="w-full h-12 flex items-center justify-center rounded-md transition-colors hover:bg-blue-100 text-sm">{month}</button>);
    const renderYears = () => {
        const currentYear = viewDate.jYear();
        const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);
        return years.map(year => <button type="button" key={year} onClick={() => handleYearClick(year)} className="w-full h-12 flex items-center justify-center rounded-md transition-colors hover:bg-blue-100 text-sm">{year}</button>);
    };

    const displayValue = selectedDate ? moment(selectedDate).format('jYYYY/jM/jD') : '';

    return (
        <div className="relative w-full" ref={pickerRef}>
            <input readOnly value={displayValue} onClick={() => setIsOpen(!isOpen)} placeholder="انتخاب تاریخ" className="mt-1 block w-full cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            {isOpen && (
                <div className="absolute z-20 mt-2 w-[300px] bg-white rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => view === 'days' ? handleMonthNav(-1) : handleYearNav(-1)} className="p-2 rounded-full hover:bg-gray-100">{'<'}</button>
                        <div className="flex gap-2 font-semibold text-gray-700">
                            {view === 'days' && <button onClick={() => setView('months')} className="hover:text-blue-600">{viewDate.format('jMMMM')}</button>}
                            <button onClick={() => setView('years')} className="hover:text-blue-600">{viewDate.format('jYYYY')}</button>
                        </div>
                        <button type="button" onClick={() => view === 'days' ? handleMonthNav(1) : handleYearNav(1)} className="p-2 rounded-full hover:bg-gray-100">{'>'}</button>
                    </div>
                    {view === 'days' && <><div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">{['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{renderDays()}</div></>}
                    {view === 'months' && <div className="grid grid-cols-3 gap-2">{renderMonths()}</div>}
                    {view === 'years' && <div className="grid grid-cols-4 gap-2">{renderYears()}</div>}
                </div>
            )}
        </div>
    );
};


// --- کامپوننت اصلی صفحه ویرایش مشتری ---
const EditCustomerPage = () => {
    const { customerId } = useParams();
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        company_name: '', 
        contact_person_name: '', 
        contract_end_date: '',
        customer_type: 'normal', 
        server_ip: '', 
        server_port: 22,
        server_username: '', 
        server_password: '', 
        app_folder_path: '',
        git_react_repo: '',
        git_php_repo: '',
        git_username: '',
        git_access_token: '',
        git_ssh_key: '',
        git_ssh_key_public: '',
        react_branch: 'main',
        php_branch: 'main',
        project_server_path: '',
        git_react_repo_ssh: '',
        git_php_repo_ssh: '',
        preferred_connection: 'https'
    });
    
    const [gitOutput, setGitOutput] = useState('');
    const [isGitLoading, setIsGitLoading] = useState(false);
    const [contractDate, setContractDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [gitStatus, setGitStatus] = useState({
        reactStatus: { needsUpdate: false, behindCommits: 0, lastCommitDate: null },
        phpStatus: { needsUpdate: false, behindCommits: 0, lastCommitDate: null }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`http://localhost/api/customers.php/customers/${customerId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok && result.customer) {
                    setFormData(result.customer);
                    if (result.customer.contract_end_date) {
                        setContractDate(moment(result.customer.contract_end_date, 'YYYY-MM-DD').toDate());
                    }
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

    // بررسی وضعیت به‌روزرسانی پروژه‌های مشتری
    const checkRepositoryStatus = async (type) => {
        setIsGitLoading(true);
        setGitOutput('در حال بررسی وضعیت ریپازیتوری...');
        try {
            // برای مثال، با استفاده از API گیت‌هاب یا گیت‌لب
            const response = await fetch(`http://localhost/api/git/compare-repos.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId,
                    projectType: type, // 'react' یا 'php'
                    customerRepoUrl: type === 'react' ? formData.git_react_repo : formData.git_php_repo,
                    customerBranch: type === 'react' ? formData.react_branch : formData.php_branch,
                    gitUsername: formData.git_username,
                    gitAccessToken: formData.git_access_token,
                    gitSshKey: formData.git_ssh_key,
                    companyRepoUrl: type === 'react' ? process.env.REACT_APP_COMPANY_REACT_REPO : process.env.REACT_APP_COMPANY_PHP_REPO
                })
            });

            const data = await response.json();
            if (response.ok) {
                setGitStatus(prev => ({
                    ...prev,
                    [`${type}Status`]: {
                        needsUpdate: data.needsUpdate,
                        behindCommits: data.behindCommits,
                        lastCommitDate: data.lastCommitDate
                    }
                }));
                setGitOutput(prev => prev + '\n' + data.message);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(`خطا در بررسی وضعیت ریپازیتوری ${type}: ${err.message}`);
            setGitOutput(prev => prev + '\nخطا: ' + err.message);
        } finally {
            setIsGitLoading(false);
        }
    };

    // به‌روزرسانی پروژه مشتری
    const updateCustomerProject = async (type) => {
        setIsGitLoading(true);
        setGitOutput(`در حال به‌روزرسانی پروژه ${type}...`);
        try {
            const response = await fetch(`http://localhost/api/git/update-repo.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId,
                    projectType: type,
                    customerRepoUrl: type === 'react' ? formData.git_react_repo : formData.git_php_repo,
                    customerBranch: type === 'react' ? formData.react_branch : formData.php_branch,
                    gitUsername: formData.git_username,
                    gitAccessToken: formData.git_access_token,
                    gitSshKey: formData.git_ssh_key,
                    serverPath: formData.project_server_path
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage(`پروژه ${type} با موفقیت به‌روز شد`);
                setGitOutput(prev => prev + '\n' + data.message);
                // به‌روزرسانی وضعیت
                await checkRepositoryStatus(type);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(`خطا در به‌روزرسانی پروژه ${type}: ${err.message}`);
            setGitOutput(prev => prev + '\nخطا: ' + err.message);
        } finally {
            setIsGitLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateChange = useCallback((date) => {
        setContractDate(date);
        setFormData(prev => ({ ...prev, contract_end_date: date ? moment(date).format('YYYY-MM-DD') : '' }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
        
        try {
            // فیلدهای مورد نیاز API را آماده می‌کنیم
            const requestData = {
                ...formData,
                server_port: parseInt(formData.server_port) || 22, // تبدیل به عدد
            };

            const response = await fetch(`http://localhost/api/customers.php/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(result.message || 'اطلاعات مشتری با موفقیت به‌روز شد');
                // به‌روزرسانی وضعیت گیت در صورت تغییر در اطلاعات مربوطه
                if (formData.git_react_repo || formData.git_php_repo) {
                    checkRepositoryStatus('react');
                    checkRepositoryStatus('php');
                }
            } else {
                throw new Error(result.error || 'خطا در ویرایش مشتری');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGitCommand = async (command, branch = null) => {
        setIsGitLoading(true);
        setGitOutput('');
        setError('');
        try {
            const body = {
                customer_id: parseInt(customerId),
                command: command,
            };
            if (branch) body.branch = branch;

            const response = await fetch("http://localhost/api/git_api.php", {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (response.ok) {
                setGitOutput(result.output);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err.message);
            setGitOutput(`Error: ${err.message}`);
        } finally {
            setIsGitLoading(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center">در حال بارگذاری اطلاعات مشتری...</div>;
    if (error && !successMessage) return <div className="p-10 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">ویرایش مشتری: {formData.company_name}</h1>
                {successMessage && <p className="text-green-600 mb-4 bg-green-100 p-3 rounded-md">{successMessage}</p>}

                {/* بخش وضعیت پروژه‌ها */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">وضعیت پروژه‌ها</h2>
                    
                    {/* پروژه React */}
                    <div className="mb-4 p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">پروژه React</h3>
                            <div className="space-x-2 space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => checkRepositoryStatus('react')}
                                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    disabled={isGitLoading}
                                >
                                    بررسی وضعیت
                                </button>
                                {gitStatus.reactStatus.needsUpdate && (
                                    <button
                                        type="button"
                                        onClick={() => updateCustomerProject('react')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        disabled={isGitLoading}
                                    >
                                        به‌روزرسانی
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {gitStatus.reactStatus.lastCommitDate && (
                                <p>آخرین به‌روزرسانی: {moment(gitStatus.reactStatus.lastCommitDate).format('jYYYY/jM/jD HH:mm')}</p>
                            )}
                            {gitStatus.reactStatus.behindCommits > 0 && (
                                <p className="text-amber-600">{gitStatus.reactStatus.behindCommits} کامیت عقب‌تر از نسخه اصلی</p>
                            )}
                        </div>
                    </div>

                    {/* پروژه PHP */}
                    <div className="p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">پروژه PHP</h3>
                            <div className="space-x-2 space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => checkRepositoryStatus('php')}
                                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    disabled={isGitLoading}
                                >
                                    بررسی وضعیت
                                </button>
                                {gitStatus.phpStatus.needsUpdate && (
                                    <button
                                        type="button"
                                        onClick={() => updateCustomerProject('php')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        disabled={isGitLoading}
                                    >
                                        به‌روزرسانی
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {gitStatus.phpStatus.lastCommitDate && (
                                <p>آخرین به‌روزرسانی: {moment(gitStatus.phpStatus.lastCommitDate).format('jYYYY/jM/jD HH:mm')}</p>
                            )}
                            {gitStatus.phpStatus.behindCommits > 0 && (
                                <p className="text-amber-600">{gitStatus.phpStatus.behindCommits} کامیت عقب‌تر از نسخه اصلی</p>
                            )}
                        </div>
                    </div>

                    <GitUpdateChecker customerId={customerId} />

                    {/* نمایش خروجی Git */}
                    {gitOutput && (
                        <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm font-mono">{gitOutput}</pre>
                        </div>
                    )}
                </div>

                {/* بخش وضعیت پروژه‌ها */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">وضعیت پروژه‌ها</h2>
                    
                    {/* پروژه React */}
                    <div className="mb-4 p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">پروژه React</h3>
                            <div className="space-x-2 space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => checkRepositoryStatus('react')}
                                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    disabled={isGitLoading}
                                >
                                    بررسی وضعیت
                                </button>
                                {gitStatus.reactStatus.needsUpdate && (
                                    <button
                                        type="button"
                                        onClick={() => updateCustomerProject('react')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        disabled={isGitLoading}
                                    >
                                        به‌روزرسانی
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {gitStatus.reactStatus.lastCommitDate && (
                                <p>آخرین به‌روزرسانی: {moment(gitStatus.reactStatus.lastCommitDate).format('jYYYY/jM/jD HH:mm')}</p>
                            )}
                            {gitStatus.reactStatus.behindCommits > 0 && (
                                <p className="text-amber-600">{gitStatus.reactStatus.behindCommits} کامیت عقب‌تر از نسخه اصلی</p>
                            )}
                        </div>
                    </div>

                    {/* پروژه PHP */}
                    <div className="p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">پروژه PHP</h3>
                            <div className="space-x-2 space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => checkRepositoryStatus('php')}
                                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    disabled={isGitLoading}
                                >
                                    بررسی وضعیت
                                </button>
                                {gitStatus.phpStatus.needsUpdate && (
                                    <button
                                        type="button"
                                        onClick={() => updateCustomerProject('php')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        disabled={isGitLoading}
                                    >
                                        به‌روزرسانی
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {gitStatus.phpStatus.lastCommitDate && (
                                <p>آخرین به‌روزرسانی: {moment(gitStatus.phpStatus.lastCommitDate).format('jYYYY/jM/jD HH:mm')}</p>
                            )}
                            {gitStatus.phpStatus.behindCommits > 0 && (
                                <p className="text-amber-600">{gitStatus.phpStatus.behindCommits} کامیت عقب‌تر از نسخه اصلی</p>
                            )}
                        </div>
                    </div>

                    {/* نمایش خروجی Git */}
                    {gitOutput && (
                        <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm font-mono">{gitOutput}</pre>
                        </div>
                    )}
                </div>

                {/* اطلاعات اصلی */}
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">اطلاعات اصلی</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام شرکت</label>
                        <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام شخص رابط</label>
                        <input type="text" name="contact_person_name" value={formData.contact_person_name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نوع مشتری</label>
                        <select name="customer_type" value={formData.customer_type || 'normal'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="normal">عادی</option>
                            <option value="golden">طلایی</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تاریخ پایان قرارداد</label>
                        <CustomJalaliDatePicker selectedDate={contractDate} onChange={handleDateChange} />
                    </div>
                </div>
                
                <hr/>

                <h2 className="text-xl font-semibold text-gray-700 pt-4">اطلاعات سرور</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">آدرس IP سرور</label>
                        <input type="text" name="server_ip" value={formData.server_ip || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">پورت</label>
                        <input type="number" name="server_port" value={formData.server_port || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام کاربری سرور</label>
                        <input type="text" name="server_username" value={formData.server_username || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">رمز عبور سرور</label>
                        <input type="password" name="server_password" value={formData.server_password || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">آدرس پوشه وب حساب</label>
                    <input type="text" name="app_folder_path" value={formData.app_folder_path || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="/home/user/public_html"/>
                </div>

                <hr/>

                <h2 className="text-xl font-semibold text-gray-700 pt-4">اطلاعات Git</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">آدرس HTTPS مخزن React</label>
                        <input type="text" name="git_react_repo" value={formData.git_react_repo || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://github.com/username/react-project.git"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">آدرس SSH مخزن React</label>
                        <input type="text" name="git_react_repo_ssh" value={formData.git_react_repo_ssh || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="git@github.com:username/react-project.git"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">شاخه اصلی React</label>
                        <input type="text" name="react_branch" value={formData.react_branch || 'main'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="main"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">آدرس HTTPS مخزن PHP</label>
                        <input type="text" name="git_php_repo" value={formData.git_php_repo || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://github.com/username/php-project.git"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">آدرس SSH مخزن PHP</label>
                        <input type="text" name="git_php_repo_ssh" value={formData.git_php_repo_ssh || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="git@github.com:username/php-project.git"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">شاخه اصلی PHP</label>
                        <input type="text" name="php_branch" value={formData.php_branch || 'main'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="main"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام کاربری Git</label>
                        <input type="text" name="git_username" value={formData.git_username || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">توکن دسترسی Git</label>
                        <input type="password" name="git_access_token" value={formData.git_access_token || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">روش ترجیحی اتصال</label>
                    <select name="preferred_connection" value={formData.preferred_connection || 'https'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="https">HTTPS</option>
                        <option value="ssh">SSH</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">کلید SSH خصوصی</label>
                        <textarea name="git_ssh_key" value={formData.git_ssh_key || ''} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">کلید SSH عمومی</label>
                        <textarea name="git_ssh_key_public" value={formData.git_ssh_key_public || ''} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"></textarea>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">مسیر پروژه روی سرور</label>
                    <input type="text" name="project_server_path" value={formData.project_server_path || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="/var/www/html/project-folder"/>
                </div>

                <div className="pt-5 flex items-center gap-4">
                    <button type="submit" disabled={isSubmitting} className="flex-grow bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </button>
                    <Link to="/customers" className="text-center bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
                        بازگشت به لیست
                    </Link>
                </div>
            </form>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">مدیریت Git</h2>
                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={() => handleGitCommand('pull')} disabled={isGitLoading} className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-300">
                        {isGitLoading ? '...' : 'دریافت تغییرات (Pull)'}
                    </button>
                    <button onClick={() => { const branch = prompt('نام شاخه (branch) مورد نظر را وارد کنید:'); if(branch) handleGitCommand('checkout', branch); }} disabled={isGitLoading} className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-yellow-300">
                        {isGitLoading ? '...' : 'تغییر شاخه (Checkout)'}
                    </button>
                </div>
                {(gitOutput || (error && isGitLoading)) && (
                    <pre className={`mt-4 p-4 rounded-md text-xs whitespace-pre-wrap max-h-60 overflow-y-auto ${error && isGitLoading ? 'bg-red-900 text-red-200' : 'bg-gray-900 text-white'}`}>
                        {error && isGitLoading ? `Error: ${error}` : gitOutput}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default EditCustomerPage;
