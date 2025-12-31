import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-slate-700 shimmer-bg"></div>
            <div className="p-4 text-center">
                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-3/4 mx-auto shimmer-bg"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-md w-1/2 mx-auto mt-2 shimmer-bg"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;