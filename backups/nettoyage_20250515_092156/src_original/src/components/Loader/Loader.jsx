import React from 'react';

const Loader = () => {
  return (
    <div className="flex-col gap-4 w-full flex items-center justify-center">
      <div className="w-20 h-20 border-4 border-transparent text-flodrama-blue text-4xl animate-spin flex items-center justify-center border-t-flodrama-blue rounded-full">
        <div className="w-16 h-16 border-4 border-transparent text-flodrama-fuchsia text-2xl animate-spin flex items-center justify-center border-t-flodrama-fuchsia rounded-full" />
      </div>
    </div>
  );
}

export default Loader;
