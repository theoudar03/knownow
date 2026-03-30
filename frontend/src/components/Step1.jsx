import React from 'react';

const Step1 = ({ inputText, setInputText, onGenerateCaption, loading, error }) => {
  return (
    <div className="bg-white/70 backdrop-blur-lg shadow-xl ring-1 ring-gray-900/5 rounded-3xl p-8 sm:p-10 w-full max-w-2xl animate-fade-in-up">
      <div className="space-y-6">
        <div>
          <label htmlFor="academic-text" className="block text-lg font-semibold text-gray-800 mb-2">
            1. What do you want to memify?
          </label>
          <textarea
            id="academic-text"
            rows="5"
            className="block w-full text-gray-700 bg-white/50 px-5 py-4 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-base sm:text-lg resize-none"
            placeholder="Enter academic message (e.g., Exam starts tomorrow...)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center text-red-600">
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        <button
          onClick={onGenerateCaption}
          disabled={loading}
          className={`w-full flex justify-center py-4 px-6 border-0 rounded-xl shadow-md text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 ${
            loading ? 'opacity-75 cursor-not-allowed hover:translate-y-0' : ''
          }`}
        >
          {loading ? (
             <span className="flex items-center space-x-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>Generating caption...</span>
             </span>
          ) : (
             <span>Generate Caption 🚀</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step1;
