import React from 'react';

const BackgroundBlobs = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-opacity duration-700 ease-in-out">
      {/* Light Mode Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-purple-300 to-purple-200 rounded-full filter blur-[80px] sm:blur-[100px] opacity-40 dark:opacity-0 animate-float-slow mix-blend-multiply"></div>
      
      <div className="absolute top-[20%] right-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-bl from-blue-300 to-blue-200 rounded-full filter blur-[80px] sm:blur-[100px] opacity-40 dark:opacity-0 animate-float-medium mix-blend-multiply delay-300"></div>
      
      <div className="absolute bottom-[-20%] left-[20%] w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-pink-300 to-pink-200 rounded-full filter blur-[80px] sm:blur-[100px] opacity-40 dark:opacity-0 animate-float-fast mix-blend-multiply delay-700"></div>

      {/* Dark Mode Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-purple-600 rounded-full filter blur-[100px] opacity-0 dark:opacity-30 animate-float-slow mix-blend-screen"></div>
      
      <div className="absolute top-[20%] right-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-blue-600 rounded-full filter blur-[100px] opacity-0 dark:opacity-30 animate-float-medium mix-blend-screen delay-300"></div>
      
      <div className="absolute bottom-[-10%] left-[30%] w-60 sm:w-80 h-60 sm:h-80 bg-indigo-600 rounded-full filter blur-[100px] opacity-0 dark:opacity-25 animate-float-fast mix-blend-screen delay-700"></div>
    </div>
  );
};

export default BackgroundBlobs;
