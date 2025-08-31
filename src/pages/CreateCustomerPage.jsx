import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'jalali-moment';

// کامپوننت تقویم شمسی
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
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        // اطلاعات اصلی مشتری
        company_name: '',
        contact_person_name: '',
        contract_end_date: '',
        customer_type: 'normal',
        
        // اطلاعات سرور
        server_ip: '',
        server_port: '22',
        server_username: '',
        server_password: '',
        app_folder_path: '',
        project_server_path: '',
        
        // تنظیمات گیت React
        git_react_repo: '',
        git_react_repo_ssh: '',
        react_branch: 'main',
        last_react_sync: null,
        react_sync_status: null,
        
        // تنظیمات گیت PHP
        git_php_repo: '',
        git_php_repo_ssh: '',
        php_branch: 'main',
        last_php_sync: null,
        php_sync_status: null,
        
        // تنظیمات دسترسی گیت
        git_username: '',
        git_access_token: '',
        git_ssh_key: '',
        git_ssh_key_public: '',
        preferred_connection: 'https'
    });
    
    const [contractDate, setContractDate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
                setSuccessMessage(result.message);
                setTimeout(() => navigate('/customers'), 2000);
            } else {
                throw new Error(result.error || 'خطا در ایجاد مشتری');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">افزودن مشتری جدید</h1>
            
            {error && <p className="text-red-600 mb-4 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-green-600 mb-4 bg-green-100 p-3 rounded-md">{successMessage}</p>}
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6" dir="rtl">
                {/* اطلاعات اصلی مشتری */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">اطلاعات اصلی مشتری</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شرکت</label>
                            <input 
                                type="text" 
                                name="company_name" 
                                value={formData.company_name} 
                                onChange={handleChange} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام شخص رابط</label>
                            <input 
                                type="text" 
                                name="contact_person_name" 
                                value={formData.contact_person_name} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نوع مشتری</label>
                            <select 
                                name="customer_type" 
                                value={formData.customer_type} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
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

                <hr className="my-6"/>

                {/* اطلاعات سرور */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">اطلاعات سرور</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">آدرس IP سرور</label>
                            <input 
                                type="text" 
                                name="server_ip" 
                                value={formData.server_ip} 
                                onChange={handleChange}
                                placeholder="192.168.1.1" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">پورت سرور</label>
                            <input 
                                type="number" 
                                name="server_port" 
                                value={formData.server_port} 
                                onChange={handleChange}
                                placeholder="22" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام کاربری سرور</label>
                            <input 
                                type="text" 
                                name="server_username" 
                                value={formData.server_username} 
                                onChange={handleChange}
                                placeholder="username" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">رمز عبور سرور</label>
                            <input 
                                type="password" 
                                name="server_password" 
                                value={formData.server_password} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">مسیر پوشه وب حساب</label>
                            <input 
                                type="text" 
                                name="app_folder_path" 
                                value={formData.app_folder_path} 
                                onChange={handleChange}
                                placeholder="/var/www/html/app" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">مسیر پروژه روی سرور</label>
                            <input 
                                type="text" 
                                name="project_server_path" 
                                value={formData.project_server_path} 
                                onChange={handleChange}
                                placeholder="/var/www/html/project" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <hr className="my-6"/>

                {/* تنظیمات گیت */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">تنظیمات گیت</h2>
                    
                    {/* روش ترجیحی اتصال */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">روش ترجیحی اتصال</label>
                        <div className="flex gap-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="preferred_connection"
                                    value="https"
                                    checked={formData.preferred_connection === 'https'}
                                    onChange={handleChange}
                                    className="form-radio text-blue-600"
                                />
                                <span className="mr-2">HTTPS</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="preferred_connection"
                                    value="ssh"
                                    checked={formData.preferred_connection === 'ssh'}
                                    onChange={handleChange}
                                    className="form-radio text-blue-600"
                                />
                                <span className="mr-2">SSH</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* پروژه‌های گیت */}
                <div className="space-y-6">
                    {/* تنظیمات پروژه React */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">پروژه React</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">آدرس HTTPS مخزن</label>
                                <input
                                    type="text"
                                    name="git_react_repo"
                                    value={formData.git_react_repo}
                                    onChange={handleChange}
                                    placeholder="https://github.com/user/repo.git"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">آدرس SSH مخزن</label>
                                <input
                                    type="text"
                                    name="git_react_repo_ssh"
                                    value={formData.git_react_repo_ssh}
                                    onChange={handleChange}
                                    placeholder="git@github.com:user/repo.git"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">شاخه اصلی</label>
                                <input
                                    type="text"
                                    name="react_branch"
                                    value={formData.react_branch}
                                    onChange={handleChange}
                                    placeholder="main"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* تنظیمات پروژه PHP */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">پروژه PHP</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">آدرس HTTPS مخزن</label>
                                <input
                                    type="text"
                                    name="git_php_repo"
                                    value={formData.git_php_repo}
                                    onChange={handleChange}
                                    placeholder="https://github.com/user/repo.git"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">آدرس SSH مخزن</label>
                                <input
                                    type="text"
                                    name="git_php_repo_ssh"
                                    value={formData.git_php_repo_ssh}
                                    onChange={handleChange}
                                    placeholder="git@github.com:user/repo.git"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">شاخه اصلی</label>
                                <input
                                    type="text"
                                    name="php_branch"
                                    value={formData.php_branch}
                                    onChange={handleChange}
                                    placeholder="main"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* دسترسی‌های گیت */}
                <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">دسترسی‌های گیت</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام کاربری گیت</label>
                            <input
                                type="text"
                                name="git_username"
                                value={formData.git_username}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">توکن دسترسی</label>
                            <input
                                type="password"
                                name="git_access_token"
                                value={formData.git_access_token}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">کلید SSH خصوصی</label>
                            <textarea
                                name="git_ssh_key"
                                value={formData.git_ssh_key}
                                onChange={handleChange}
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                                dir="ltr"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">کلید SSH عمومی</label>
                            <textarea
                                name="git_ssh_key_public"
                                value={formData.git_ssh_key_public}
                                onChange={handleChange}
                                rows={2}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ssh-rsa AAAA..."
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                {/* دکمه‌های فرم */}
                <div className="flex items-center justify-between pt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                در حال ثبت...
                            </>
                        ) : (
                            'ثبت مشتری جدید'
                        )}
                    </button>
                    
                    <Link to="/customers" className="text-gray-600 hover:text-gray-800">
                        انصراف
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default CreateCustomerPage;
