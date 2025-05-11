'use client';

import React from 'react';

export function UnauthorizedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
        <h2 className="text-lg font-bold text-red-600 mb-2">Unauthorized Access</h2>
        <p className="text-gray-700 mb-4">You cannot perform this activity. Please reach out to the admin.</p>
        <button
          onClick={onClose}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
} 