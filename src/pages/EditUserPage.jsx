import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import moment from 'jalali-moment';

// ====================================================================
// --- کامپوننت تقویم شمسی سفارشی، زیبا و بی‌نقص ---
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

// --- کامپوننت اصلی صفحه ویرایش و جزئیات کاربر ---
const EditUserPage = () => {
    const { userId } = useParams();
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', email: '', role_id: 2 });
    const [sessions, setSessions] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date());
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUserData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        
        const formattedDate = moment(filterDate).format('YYYY-MM-DD');
        const url = `http://localhost/api/users.php/users/${userId}/details?date=${formattedDate}`;

        try {
            const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok) {
                setFormData(data.profile);
                setSessions(data.sessions);
            } else {
                throw new Error(data.error || 'خطا در دریافت اطلاعات کاربر');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, token, filterDate]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(''); setSuccessMessage('');

        try {
            const response = await fetch(`http://localhost/api/users.php/users/${userId}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...formData, role_id: parseInt(formData.role_id, 10) })
            });
            const result = await response.json();
            if (response.ok) {
                setSuccessMessage(result.message);
            } else {
                throw new Error(result.error || 'خطا در ویرایش کاربر');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && sessions.length === 0) return <div className="p-10 text-center">در حال بارگذاری اطلاعات کاربر...</div>;
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">ویرایش کاربر: {formData.username}</h1>
                {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">نام کاربری</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">ایمیل</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">نقش کاربر</label>
                    <select name="role_id" value={formData.role_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value={2}>کاربر عادی</option>
                        <option value={1}>ادمین</option>
                    </select>
                </div>
                <div className="pt-5 flex items-center gap-4">
                    <button type="submit" disabled={isSubmitting} className="flex-grow bg-blue-600 text-white py-2 px-4 rounded-md">
                        {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </button>
                    <Link to="/" className="text-center bg-gray-500 text-white py-2 px-4 rounded-md">
                        بازگشت به لیست
                    </Link>
                </div>
            </form>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">تاریخچه فعالیت‌ها</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-semibold mb-2">فیلتر بر اساس روز</h3>
                        <CustomJalaliDatePicker selectedDate={filterDate} onChange={(date) => date && setFilterDate(date)} />
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-2">
                            فعالیت‌های روز: <span className="text-blue-600">{moment(filterDate).format('jYYYY/jM/jD')}</span>
                        </h3>
                        <div className="space-y-6 max-h-96 overflow-y-auto border p-4 rounded-md">
                            {isLoading ? <p>در حال بارگذاری فعالیت‌ها...</p> : (
                                sessions.length > 0 ? sessions.map((session, index) => (
                                    <div key={index} className="border-b pb-4 last:border-b-0">
                                        <h4 className="font-semibold text-gray-700">
                                            ورود در: <span className="font-normal text-gray-600">{new Date(session.login_time).toLocaleString('fa-IR')}</span>
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            خروج: {session.logout_time ? new Date(session.logout_time).toLocaleString('fa-IR') : 'هنوز فعال'} | IP: {session.ip_address}
                                        </p>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm pr-4">
                                            {session.activities.length > 0 ? session.activities.map((activity, actIndex) => (
                                                <li key={actIndex} className="text-gray-600">
                                                    <span className="font-semibold">{activity.action}</span> در صفحه <span className="text-blue-600">{activity.page}</span>
                                                    <span className="text-gray-400"> (ساعت {new Date(activity.time).toLocaleTimeString('fa-IR')})</span>
                                                </li>
                                            )) : <li className="text-gray-400">هیچ فعالیتی برای این نشست ثبت نشده است.</li>}
                                        </ul>
                                    </div>
                                )) : <p className="text-gray-500">هیچ فعالیتی برای این روز یافت نشد.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditUserPage;
