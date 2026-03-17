// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white px-6 py-12">
    <div className="w-full max-w-3xl text-center">
      <div className="flex justify-center">
        <img
          src="/assets/page-not-found.png"
          alt="Page not found"
          className="w-[360px] max-w-full"
        />
      </div>
      <h1 className="mt-6 text-4xl font-semibold text-gray-700">Page not found</h1>
      <p className="mt-3 text-base text-gray-500">
        Sorry, we couldn't find the page you're looking for. It may have been moved or no longer exists.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-primary text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
        >
          <Home className="h-4 w-4" />
          Take me home
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage; 
