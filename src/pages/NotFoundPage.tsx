import React from 'react';

const NotFoundPage: React.FC = () => (
  <div className="p-8 text-center">
    <h1 className="text-3xl font-bold text-primary mb-4">404 - Page Not Found</h1>
    <p className="text-secondary text-lg mb-6">
      Sorry, the page you are looking for does not exist.
    </p>
    <a href="/homepage" className="text-primary underline">Go to Home</a>
  </div>
);

export default NotFoundPage; 