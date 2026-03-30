import React from 'react';

const Step2 = ({ topText, setTopText, bottomText, setBottomText, onNext }) => {
  return (
    <div className="bg-white/70 backdrop-blur-lg shadow-xl ring-1 ring-gray-900/5 rounded-3xl p-8 sm:p-10 w-full max-w-2xl animate-fade-in-up">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            2. Edit your caption
          </h2>
          <p className="text-sm text-gray-500 mb-4">You can edit the caption before generating the meme.</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="top-text" className="block text-sm font-medium text-gray-700 mb-1">Top Text</label>
              <input
                id="top-text"
                type="text"
                className="block w-full text-gray-800 bg-white/50 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bottom-text" className="block text-sm font-medium text-gray-700 mb-1">Bottom Text</label>
              <input
                id="bottom-text"
                type="text"
                className="block w-full text-gray-800 bg-white/50 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full flex justify-center py-4 px-6 border border-gray-300 rounded-xl shadow-sm text-lg font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
        >
          Next: Choose Template
        </button>
      </div>
    </div>
  );
};

export default Step2;
