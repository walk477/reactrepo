import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import moment from 'jalali-moment';

// --- توابع کمکی ---
const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/150x150/E2E8F0/A0AEC0?text=Profile';
    if (url.startsWith('blob:')) return url;
    return `http://localhost${url}`;
};

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
        if (selectedDate) {
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
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-sm ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'} ${!isSelected && isToday ? 'border-2 border-blue-500' : ''}`}>
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
                        <button type="button" onClick={() => view === 'days' ? handleMonthNav(1) : handleYearNav(1)} className="p-2 rounded-full hover:bg-gray-100">{'<'}</button>
                        <div className="flex gap-2 font-semibold text-gray-700">
                            {view === 'days' && <button onClick={() => setView('months')} className="hover:text-blue-600">{viewDate.format('jMMMM')}</button>}
                            <button onClick={() => setView('years')} className="hover:text-blue-600">{viewDate.format('jYYYY')}</button>
                        </div>
                        <button type="button" onClick={() => view === 'days' ? handleMonthNav(-1) : handleYearNav(-1)} className="p-2 rounded-full hover:bg-gray-100">{'>'}</button>
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


// --- کامپوننت اصلی و یکپارچه صفحه ویرایش پروفایل ---
const ProfilePage = () => {
    const { token } = useSelector((state) => state.auth);

    const [infoFormData, setInfoFormData] = useState({
        email: '', phone_number: '', province: '', city: '', address: '', birth_date: ''
    });
    const [passwordFormData, setPasswordFormData] = useState({
        current_password: '', new_password: ''
    });
    
    const [birthDate, setBirthDate] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState({ info: false, password: false, picture: false });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [username, setUsername] = useState('');

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!token) {
                setIsLoading(false);
                setMessage({ type: 'error', text: 'برای دسترسی به این صفحه باید وارد شوید.' });
                return;
            }
            try {
                const response = await fetch("http://localhost/api/users.php/users/profile", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setUsername(data.username || '');
                    setInfoFormData({
                        email: data.email || '',
                        phone_number: data.phone_number || '',
                        province: data.province || '',
                        city: data.city || '',
                        address: data.address || '',
                        birth_date: data.birth_date || '',
                    });
                    if (data.birth_date) setBirthDate(moment(data.birth_date, 'YYYY-MM-DD').toDate());
                    setPreviewImage(data.profile_image_url);
                } else {
                    setMessage({ type: 'error', text: data.error || 'خطا در دریافت اطلاعات' });
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [token]);

    const handleInfoChange = (e) => setInfoFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e) => setPasswordFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleDateChange = (date) => {
        setBirthDate(date);
        setInfoFormData(prev => ({ ...prev, birth_date: date ? moment(date).format('YYYY-MM-DD') : '' }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(prev => ({ ...prev, info: true }));
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch("http://localhost/api/users.php/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(infoFormData)
            });
            const result = await response.json();
            if (result.success) setMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روز شد!' });
            else setMessage({ type: 'error', text: result.error });
        } catch (err) {
            setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
        } finally {
            setIsSubmitting(prev => ({ ...prev, info: false }));
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordFormData.new_password.length < 8) {
            setMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' });
            return;
        }
        setIsSubmitting(prev => ({ ...prev, password: true }));
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch("http://localhost/api/users.php/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(passwordFormData)
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد!' });
                setPasswordFormData({ current_password: '', new_password: '' });
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
        } finally {
            setIsSubmitting(prev => ({ ...prev, password: false }));
        }
    };

    const handlePictureSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        setIsSubmitting(prev => ({ ...prev, picture: true }));
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('profile_picture', selectedFile);
        try {
            const response = await fetch("http://localhost/api/users.php/users/profile/picture", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'عکس پروفایل با موفقیت آپلود شد!' });
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
        } finally {
            setIsSubmitting(prev => ({ ...prev, picture: false }));
        }
    };

    if (isLoading) return <div className="text-center p-10">در حال بارگذاری...</div>;
    if (!token) return <div className="text-center p-10 text-red-600">{message.text || 'لطفا ابتدا وارد شوید.'}</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl bg-gray-50 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">ویرایش پروفایل ({username})</h1>
            
            {message.text && (
                <div className={`p-4 mb-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* بخش عکس پروفایل */}
                {/* <div className="md:col-span-1">
                    <form onSubmit={handlePictureSubmit} className="w-full text-center p-6 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">عکس پروفایل</h2>
                        <img src={getImageUrl(previewImage)} alt="Profile Preview" className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 mb-4 mx-auto" />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mb-2">
                            انتخاب عکس
                        </button>
                        <button type="submit" disabled={!selectedFile || isSubmitting.picture} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                            {isSubmitting.picture ? 'در حال آپلود...' : 'آپلود عکس'}
                        </button>
                    </form>
                </div> */}

                {/* بخش اطلاعات و رمز عبور */}
                <div className="md:col-span-2 p-6 bg-white rounded-lg shadow space-y-8">
                    {/* فرم اطلاعات شخصی */}
                    {/* <form onSubmit={handleInfoSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold mb-2 text-gray-700">اطلاعات شخصی</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">ایمیل</label>
                            <input type="email" name="email" value={infoFormData.email} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">شماره تماس</label>
                            <input type="text" name="phone_number" value={infoFormData.phone_number} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">استان</label>
                                <input type="text" name="province" value={infoFormData.province} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">شهر</label>
                                <input type="text" name="city" value={infoFormData.city} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">آدرس</label>
                            <textarea name="address" value={infoFormData.address} onChange={handleInfoChange} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">تاریخ تولد</label>
                            <CustomJalaliDatePicker selectedDate={birthDate} onChange={handleDateChange} />
                        </div>
                        <button type="submit" disabled={isSubmitting.info} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-300">
                            {isSubmitting.info ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
                        </button>
                    </form>
                    <hr/> */}
                    {/* فرم تغییر رمز عبور */}
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold mb-2 text-gray-700">تغییر رمز عبور</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">رمز عبور فعلی</label>
                            <input type="password" name="current_password" value={passwordFormData.current_password} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">رمز عبور جدید</label>
                            <input type="password" name="new_password" value={passwordFormData.new_password} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="حداقل ۸ کاراکتر"/>
                        </div>
                        <button type="submit" disabled={isSubmitting.password} className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 disabled:bg-yellow-300">
                            {isSubmitting.password ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
