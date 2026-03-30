import React from 'react';

const templates = [
  { id: '181913649', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', tone: 'sarcastic/funny' },
  { id: '112126428', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', tone: 'sarcastic/funny' },
  { id: '87743020', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', tone: 'stress/confusion' },
  { id: '100947', name: 'Matrix Morpheus', url: 'https://i.imgflip.com/25w3.jpg', tone: 'serious' }
];

const Step3 = ({ selectedTemplate, setSelectedTemplate, onGenerateMeme, loading, tone }) => {
  // Try to recommend templates based on API tone keyword matched
  const recommended = templates.filter(t => t.tone.includes(tone) || tone.includes('sarcastic'));

  return (
    <div className="bg-white/70 backdrop-blur-lg shadow-xl ring-1 ring-gray-900/5 rounded-3xl p-8 sm:p-10 w-full max-w-2xl animate-fade-in-up">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            3. Choose your meme template
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {templates.map(tmpl => {
              const isSelected = tmpl.id === selectedTemplate;
              const isRecommended = recommended.some(r => r.id === tmpl.id);
              
              return (
                <div 
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 group ${
                    isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]' : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="h-32 bg-gray-100 flex justify-center items-center overflow-hidden">
                     <img src={tmpl.url} alt={tmpl.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className={`p-3 text-center text-sm font-medium ${isSelected ? 'bg-purple-50 text-purple-700' : 'bg-white text-gray-600'}`}>
                     {tmpl.name}
                     {isRecommended && !isSelected && <span className="block text-xs text-green-500 mt-1">Recommended for '{tone}'</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onGenerateMeme}
          disabled={loading || !selectedTemplate}
          className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 ${
            loading || !selectedTemplate ? 'opacity-75 cursor-not-allowed hover:translate-y-0' : ''
          }`}
        >
          {loading ? (
             <span className="flex items-center space-x-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>Brewing meme...</span>
             </span>
          ) : (
             <span>Generate Meme 🎨</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3;
