import React from 'react';

const TestConnectionSection = ({ onTest, isTesting, result }) => (
    <div className="mt-6 pt-4 border-t">
        <h3 className="text-md font-semibold text-gray-700 mb-3">تست اتصال</h3>
        <button type="button" onClick={onTest} disabled={isTesting} className="bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isTesting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isTesting ? 'در حال تست...' : 'تست اتصال'}
        </button>
        {result.message && <p className={`mt-3 text-sm font-medium ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.message}</p>}
    </div>
);

export default TestConnectionSection;
