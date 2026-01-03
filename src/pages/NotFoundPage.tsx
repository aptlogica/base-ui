import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 text-lg mb-8">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link 
        to="/homepage" 
        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Go to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage; 