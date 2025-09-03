import React from 'react';
import CustomJalaliDatePicker from './CustomJalaliDatePicker.jsx';

const CustomerInfoForm = ({ formData, handleChange, contractDate, handleDateChange }) => (
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
);

export default CustomerInfoForm;
