import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * یک هوک سفارشی برای ارسال دوره‌ای "ضربان قلب" (heartbeat) به سرور.
 * این هوک به صورت خودکار آدرس صفحه فعلی کاربر را نیز ارسال می‌کند.
 * @param {number} interval - فاصله زمانی بین هر درخواست به میلی‌ثانیه (پیش‌فرض: ۶۰ ثانیه).
 */
const useHeartbeat = (interval = 60000) => {
    // توکن کاربر را از Redux state می‌خوانیم
    const token = useSelector((state) => state.auth.token);
    // آبجکت location را از React Router می‌گیریم تا به آدرس فعلی دسترسی داشته باشیم
    const location = useLocation();
    const intervalId = useRef(null);

    useEffect(() => {
        // تابع اصلی برای ارسال درخواست به سرور
        const sendHeartbeat = (currentPath) => {
            // اگر توکن وجود نداشت، هیچ کاری انجام نده
            if (!token) return;

            fetch("http://localhost/api/users.php/heartbeat", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                // آدرس صفحه فعلی را در بدنه درخواست ارسال می‌کنیم
                body: JSON.stringify({ page: currentPath })
            })
            .catch(error => console.error("Heartbeat request failed:", error));
        };

        // هر اینتروال قبلی را پاک می‌کنیم تا از تداخل جلوگیری شود
        if (intervalId.current) {
            clearInterval(intervalId.current);
        }

        // فقط در صورتی که کاربر لاگین کرده باشد، اینتروال را تنظیم می‌کنیم
        if (token) {
            // یک "ضربان قلب" اولیه را بلافاصله پس از بارگذاری یا تغییر صفحه ارسال می‌کنیم
            sendHeartbeat(location.pathname);

            // اینتروال جدید را برای ارسال‌های دوره‌ای تنظیم می‌کنیم
            intervalId.current = setInterval(() => {
                sendHeartbeat(location.pathname);
            }, interval);
        }

        // تابع پاک‌سازی (Cleanup): وقتی کامپوننت از بین می‌رود، اینتروال را متوقف می‌کند
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
        };
    // این افکت هر زمان که توکن یا آدرس صفحه تغییر کند، دوباره اجرا می‌شود
    }, [token, location.pathname, interval]);
};

export default useHeartbeat;
