import React, { useRef, useEffect } from 'react';

const Step4 = ({ memeUrl, onReset }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleDownload = async () => {
    if (!memeUrl) return;
    try {
      const response = await fetch(memeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'knownow-meme.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
       // fallback if CORS prevents blob download
       window.open(memeUrl, '_blank');
    }
  };

  return (
    <div ref={sectionRef} className="bg-white/80 backdrop-blur-xl shadow-2xl ring-1 ring-gray-900/5 rounded-[2rem] p-6 sm:p-10 w-full max-w-2xl animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        4. Mission Accomplished 🎉
      </h2>
      
      <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50 flex justify-center items-center group relative min-h-[300px]">
        <img 
          src={memeUrl} 
          alt="Generated Meme representation of academic text" 
          className="w-full max-w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          className="flex-1 flex justify-center items-center space-x-2 py-4 px-6 rounded-xl shadow-md text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-purple-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download Meme</span>
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex text-gray-700 justify-center items-center py-4 px-6 border border-gray-200 rounded-xl shadow-sm text-base font-semibold bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          Generate Again
        </button>
      </div>
    </div>
  );
};

export default Step4;
