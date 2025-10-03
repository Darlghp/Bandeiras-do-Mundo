import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4 text-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4 mx-auto"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-md w-1/2 mx-auto mt-2"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;