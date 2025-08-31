import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// --- کامپوننت صفحه افزودن کاربر جدید ---
const CreateUserPage = () => {
    // --- Hooks & State Management ---
    const { user, token } = useSelector((state) => state.auth);
    const navigate = useNavigate(); // هوک برای هدایت کاربر پس از ثبت موفق

    // State برای نگهداری داده‌های فرم
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role_id: 2, // پیش‌فرض: کاربر عادی
    });

    // State برای مدیریت وضعیت‌های UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // بررسی اینکه آیا کاربر ادمین است یا خیر
    const isAdmin = user?.role_id === 1;

    // --- Event Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- API Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch("http://localhost/api/users.php/users", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    role_id: parseInt(formData.role_id, 10) // تبدیل نقش به عدد
                })
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.message);
                // پس از ثبت موفق، فرم را خالی کرده و کاربر را به صفحه اصلی هدایت کن
                setFormData({ username: '', email: '', password: '', role_id: 2 });
                setTimeout(() => navigate('/'), 2000); // بازگشت به داشبورد پس از ۲ ثانیه
            } else {
                throw new Error(result.error || 'خطا در ایجاد کاربر');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (!isAdmin) {
        return (
            <div className="p-10 text-center text-red-600 bg-red-100 rounded-md">
                شما دسترسی لازم برای ایجاد کاربر جدید را ندارید.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">افزودن کاربر جدید</h1>
            
            {error && <p className="text-red-600 mb-4 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-green-600 mb-4 bg-green-100 p-3 rounded-md">{successMessage}</p>}
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">نام کاربری</label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">ایمیل</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">رمز عبور</label>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        minLength="8"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="حداقل ۸ کاراکتر"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">نقش کاربر</label>
                    <select 
                        name="role_id" 
                        value={formData.role_id} 
                        onChange={handleChange} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value={2}>کاربر عادی</option>
                        <option value={1}>ادمین</option>
                    </select>
                </div>
                <div className="pt-5">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isSubmitting ? 'در حال ایجاد...' : 'ایجاد کاربر'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserPage;
