import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useSelector } from 'react-redux';

// ۱. ایجاد Context
const SettingsContext = createContext(null);

// ۲. ایجاد Provider Component
export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    // توکن کاربر را از Redux می‌خوانیم تا وضعیت لاگین را تشخیص دهیم
    const token = useSelector((state) => state.auth.token);

    // تابع برای دریافت تنظیمات که می‌تواند دوباره فراخوانی شود
    const fetchSettings = useCallback(async () => {
        // اگر کاربر لاگین کرده، اندپوینت تنظیمات شخصی را فراخوانی کن
        // این اندپوینت به صورت هوشمند تنظیمات شخصی و عمومی را ادغام می‌کند
        const url = token 
            ? "http://localhost/api/users.php/users/settings"
            : "http://localhost/api/users.php/settings";
        
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    }, [token]); // این تابع فقط زمانی که توکن تغییر کند، دوباره ساخته می‌شود

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // مقداری که در اختیار کل اپلیکیشن قرار می‌گیرد
    const value = {
        settings,
        loading,
        refetchSettings: fetchSettings // تابع برای به‌روزرسانی آنی تم
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// ۳. ایجاد یک هوک سفارشی برای دسترسی آسان به تنظیمات
export const useSettings = () => {
    return useContext(SettingsContext);
};
