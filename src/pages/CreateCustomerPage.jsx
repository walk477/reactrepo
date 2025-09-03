import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'jalali-moment';

// ====================================================================
// --- کامپوننت تقویم شمسی (بدون تغییر) ---
// ====================================================================
const CustomJalaliDatePicker = ({ selectedDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('days'); // 'days', 'months', 'years'
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

    const renderMonths = () => (
        JALALI_MONTHS.map((month, index) => (
            <button type="button" key={month} onClick={() => handleMonthClick(index)}
                className="w-full h-12 flex items-center justify-center rounded-md transition-colors hover:bg-blue-100 text-sm">
                {month}
            </button>
        ))
    );

    const renderYears = () => {
        const currentYear = viewDate.jYear();
        const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);
        return years.map(year => (
            <button type="button" key={year} onClick={() => handleYearClick(year)}
                className="w-full h-12 flex items-center justify-center rounded-md transition-colors hover:bg-blue-100 text-sm">
                {year}
            </button>
        ));
    };

    const displayValue = selectedDate ? moment(selectedDate).format('jYYYY/jM/jD') : '';

    return (
        <div className="relative w-full" ref={pickerRef}>
            <input
                readOnly value={displayValue} onClick={() => setIsOpen(!isOpen)}
                placeholder="انتخاب تاریخ"
                className="mt-1 block w-full cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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
                    {view === 'days' && <>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
                            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
                    </>}
                    {view === 'months' && <div className="grid grid-cols-3 gap-2">{renderMonths()}</div>}
                    {view === 'years' && <div className="grid grid-cols-4 gap-2">{renderYears()}</div>}
                </div>
            )}
        </div>
    );
};


// --- کامپوننت اصلی صفحه افزودن مشتری ---
const CreateCustomerPage = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    // اگر توکن نداشتیم، به صفحه لاگین هدایت می‌شویم
    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const [activeTab, setActiveTab] = useState('server'); 

    const [formData, setFormData] = useState({
        // اطلاعات اصلی مشتری
        company_name: '',
        contact_person_name: '',
        contract_end_date: '',
        customer_type: 'normal',
        deployment_type: 'server',
        
        // اطلاعات سرور
        server_ip: '',
        server_port: '22',
        server_username: '',
        server_password: '',
        app_folder_path: '',
        project_server_path: '',
        
        // تنظیمات گیت
        git_react_repo: '',
        git_react_repo_ssh: '',
        react_branch: 'main',
        git_php_repo: '',
        git_php_repo_ssh: '',
        php_branch: 'main',
        git_username: '',
        git_access_token: '',
        git_ssh_key: '',
        git_ssh_key_public: '',
        preferred_connection: 'https',

        // اطلاعات سیستم شخصی
        local_ip: '',
        local_project_path: ''
    });
    
    const [contractDate, setContractDate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        
        // اعتبارسنجی اطلاعات پایه
        if (!formData.company_name?.trim()) {
            errors.company_name = 'نام شرکت الزامی است';
        }
        if (!formData.contract_end_date) {
            errors.contract_end_date = 'تاریخ پایان قرارداد الزامی است';
        }

        // اعتبارسنجی اطلاعات سرور
        if (formData.server_ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.server_ip)) {
            errors.server_ip = 'آدرس IP معتبر نیست';
        }
        if (formData.server_port && (formData.server_port < 1 || formData.server_port > 65535)) {
            errors.server_port = 'پورت معتبر نیست';
        }
        if (formData.server_username && formData.server_username.length < 3) {
            errors.server_username = 'نام کاربری باید حداقل 3 کاراکتر باشد';
        }
        if (formData.server_password && formData.server_password.length < 8) {
            errors.server_password = 'رمز عبور باید حداقل 8 کاراکتر باشد';
        }

        // اعتبارسنجی تنظیمات گیت
        const gitRepoPattern = /^(https?:\/\/|git@).*\.git$/;
        if (formData.git_react_repo && !gitRepoPattern.test(formData.git_react_repo)) {
            errors.git_react_repo = 'آدرس مخزن گیت معتبر نیست';
        }
        if (formData.git_php_repo && !gitRepoPattern.test(formData.git_php_repo)) {
            errors.git_php_repo = 'آدرس مخزن گیت معتبر نیست';
        }
        if (formData.git_username && formData.git_username.length < 3) {
            errors.git_username = 'نام کاربری گیت باید حداقل 3 کاراکتر باشد';
        }
        if (formData.git_access_token && formData.git_access_token.length < 20) {
            errors.git_access_token = 'توکن دسترسی نامعتبر است';
        }

        // اعتبارسنجی تنظیمات گیت
        if (formData.git_react_repo && !formData.git_react_repo.endsWith('.git')) {
            errors.git_react_repo = 'آدرس مخزن گیت معتبر نیست';
        }
        if (formData.git_php_repo && !formData.git_php_repo.endsWith('.git')) {
            errors.git_php_repo = 'آدرس مخزن گیت معتبر نیست';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        console.log('Redux auth state:', { token }); // برای دیباگ

        // بررسی وجود توکن
        if (!token) {
            setError('لطفا ابتدا وارد سیستم شوید');
            navigate('/login');
            return;
        }
        
        // اعتبارسنجی فرم
        if (!validateForm()) {
            setError('لطفا خطاهای فرم را برطرف کنید');
            return;
        }

        setIsSubmitting(true);
        
        try {
            console.log('Sending request with token:', token); // برای دیباگ
            const response = await fetch("http://localhost/api/customers.php/customers", {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(result.message || "مشتری با موفقیت ایجاد شد.");
                // setTimeout(() => navigate('/customers'), 2000); // Navigation is disabled in preview.
                console.log("Success! Navigation to /customers is disabled in this preview.");
            } else {
                throw new Error(result.error || 'خطا در ایجاد مشتری');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const FormInput = ({ label, name, type = 'text', value, onChange, placeholder, error }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`mt-1 block w-full input ${error ? 'input-error' : ''}`}
            />
            {error && <p className="error-message">{error}</p>}
        </div>
    );

    const TabButton = ({ tabName, children }) => (
        <button type="button" onClick={() => handleTabChange(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${ activeTab === tabName ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            {children}
        </button>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl" dir="rtl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">افزودن مشتری جدید</h1>
            
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert"><p>{error}</p></div>}
            {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert"><p>{successMessage}</p></div>}
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-8">
                {/* بخش اطلاعات اصلی مشتری */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-3">اطلاعات اصلی مشتری</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شرکت</label>
                            <input 
                                type="text" 
                                name="company_name" 
                                value={formData.company_name} 
                                onChange={handleChange} 
                                required 
                                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${validationErrors.company_name ? 'border-red-500' : 'border-gray-300'}`} 
                            />
                            {validationErrors.company_name && (
                                <p className="mt-1 text-xs text-red-500">{validationErrors.company_name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شخص رابط</label>
                            <input type="text" name="contact_person_name" value={formData.contact_person_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نوع مشتری</label>
                            <select name="customer_type" value={formData.customer_type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500" >
                                <option value="normal">عادی</option>
                                <option value="golden">طلایی</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تاریخ پایان قرارداد</label>
                            <div className={validationErrors.contract_end_date ? 'border border-red-500 rounded-md' : ''}>
                                <CustomJalaliDatePicker selectedDate={contractDate} onChange={handleDateChange} />
                            </div>
                            {validationErrors.contract_end_date && (
                                <p className="mt-1 text-xs text-red-500">{validationErrors.contract_end_date}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* بخش تنظیمات استقرار */}
                <div className="space-y-4">
                     <h2 className="text-xl font-semibold text-gray-700 border-b pb-3">تنظیمات استقرار پروژه</h2>
                     <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mt-4">
                        <TabButton tabName="server">سرور / هاست</TabButton>
                        <TabButton tabName="git">مخزن گیت</TabButton>
                        <TabButton tabName="local">سیستم شخصی</TabButton>
                     </div>
                
                    <div className="pt-4 animate-fade-in">
                        {/* تب سرور */}
                        {activeTab === 'server' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-gray-700">آدرس IP سرور</label><input type="text" name="server_ip" value={formData.server_ip} onChange={handleChange} placeholder="192.168.1.1" className="mt-1 block w-full input"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">پورت</label><input type="number" name="server_port" value={formData.server_port} onChange={handleChange} placeholder="22" className="mt-1 block w-full input"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">نام کاربری</label><input type="text" name="server_username" value={formData.server_username} onChange={handleChange} placeholder="root" className="mt-1 block w-full input"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">رمز عبور</label><input type="password" name="server_password" value={formData.server_password} onChange={handleChange} className="mt-1 block w-full input"/></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">آدرس پوشه وب</label><input type="text" name="app_folder_path" value={formData.app_folder_path} onChange={handleChange} className="mt-1 block w-full input" placeholder="/home/user/public_html"/></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">مسیر پروژه روی سرور</label><input type="text" name="project_server_path" value={formData.project_server_path} onChange={handleChange} className="mt-1 block w-full input" placeholder="/var/www/html/project"/></div>
                                </div>
                            </div>
                        )}
                        
                        {/* تب گیت */}
                        {activeTab === 'git' && (
                             <div className="space-y-6">
                                <div>
                                    <h3 className="text-md font-semibold text-gray-600 mb-2">پروژه React</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
                                        <div><label className="block text-sm">آدرس HTTPS</label><input type="text" name="git_react_repo" value={formData.git_react_repo} onChange={handleChange} className="mt-1 block w-full input" placeholder="https://..."/></div>
                                        <div><label className="block text-sm">آدرس SSH</label><input type="text" name="git_react_repo_ssh" value={formData.git_react_repo_ssh} onChange={handleChange} className="mt-1 block w-full input" placeholder="git@..."/></div>
                                        <div><label className="block text-sm">شاخه (Branch)</label><input type="text" name="react_branch" value={formData.react_branch} onChange={handleChange} className="mt-1 block w-full input"/></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-md font-semibold text-gray-600 mb-2">پروژه PHP</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
                                       <div><label className="block text-sm">آدرس HTTPS</label><input type="text" name="git_php_repo" value={formData.git_php_repo} onChange={handleChange} className="mt-1 block w-full input" placeholder="https://..."/></div>
                                        <div><label className="block text-sm">آدرس SSH</label><input type="text" name="git_php_repo_ssh" value={formData.git_php_repo_ssh} onChange={handleChange} className="mt-1 block w-full input" placeholder="git@..."/></div>
                                        <div><label className="block text-sm">شاخه (Branch)</label><input type="text" name="php_branch" value={formData.php_branch} onChange={handleChange} className="mt-1 block w-full input"/></div>
                                    </div>
                                </div>
                                <div className="p-4 border rounded-md">
                                     <h3 className="text-md font-semibold text-gray-600 mb-4">تنظیمات عمومی Git</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm">نام کاربری Git</label>
                                            <input 
                                                type="text" 
                                                name="git_username" 
                                                value={formData.git_username} 
                                                onChange={handleChange} 
                                                className={`mt-1 block w-full input ${validationErrors.git_username ? 'input-error' : ''}`}
                                            />
                                            {validationErrors.git_username && (
                                                <p className="error-message">{validationErrors.git_username}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm">توکن دسترسی</label>
                                            <input 
                                                type="password" 
                                                name="git_access_token" 
                                                value={formData.git_access_token} 
                                                onChange={handleChange} 
                                                className={`mt-1 block w-full input ${validationErrors.git_access_token ? 'input-error' : ''}`}
                                            />
                                            {validationErrors.git_access_token && (
                                                <p className="error-message">{validationErrors.git_access_token}</p>
                                            )}
                                        </div>
                                        <div><label className="block text-sm">روش اتصال</label>
                                            <select name="preferred_connection" value={formData.preferred_connection} onChange={handleChange} className="mt-1 block w-full input bg-white">
                                                <option value="https">HTTPS</option>
                                                <option value="ssh">SSH</option>
                                            </select>
                                        </div>
                                     </div>
                                     <div className="mt-4"><label className="block text-sm">کلید خصوصی SSH</label><textarea name="git_ssh_key" value={formData.git_ssh_key} onChange={handleChange} rows="3" className="mt-1 block w-full input font-mono text-xs"></textarea></div>
                                     <div className="mt-4"><label className="block text-sm">کلید عمومی SSH</label><textarea name="git_ssh_key_public" value={formData.git_ssh_key_public} onChange={handleChange} rows="2" className="mt-1 block w-full input font-mono text-xs"></textarea></div>
                                </div>
                            </div>
                        )}
                        
                        {/* تب سیستم شخصی */}
                        {activeTab === 'local' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div><label className="block text-sm font-medium text-gray-700">آدرس IP سیستم</label><input type="text" name="local_ip" value={formData.local_ip} onChange={handleChange} placeholder="192.168.1.10" className="mt-1 block w-full input"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">مسیر پوشه پروژه</label><input type="text" name="local_project_path" value={formData.local_project_path} onChange={handleChange} placeholder="C:\Users\YourUser\Projects" className="mt-1 block w-full input"/></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* دکمه‌های فرم */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md">انصراف</a>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`
                            bg-blue-600 text-white px-6 py-2 rounded-lg 
                            hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                            transition-all duration-200 flex items-center
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {isSubmitting && (
                            <svg 
                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                <circle 
                                    className="opacity-25" 
                                    cx="12" 
                                    cy="12" 
                                    r="10" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                />
                                <path 
                                    className="opacity-75" 
                                    fill="currentColor" 
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        )}
                        {isSubmitting ? 'در حال ثبت...' : 'ثبت مشتری جدید'}
                    </button>
                </div>
            </form>
            <style>{`
                .input {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                }
                .input-error {
                    border-color: #ef4444;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }
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

export default CreateCustomerPage;

