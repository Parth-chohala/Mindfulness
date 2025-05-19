import React, { useState } from 'react';
import { X, Brain } from 'lucide-react';
import AuthDialog from './AuthDialog';

export default function WelcomeDialog({ open, onClose }) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const handleLoginRegisterClick = () => {
    // First show the auth dialog
    setShowAuthDialog(true);
    // Then close the welcome dialog
    setTimeout(() => {
      onClose();
    }, 1000); // Small delay to ensure auth dialog renders first
  };
  
  const handleAuthDialogClose = () => {
    setShowAuthDialog(false);
  };
  
  if (!open) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full mx-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain size={24} className="text-teal-500" />
              Welcome to Mindfulness
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6">
            <p className="text-gray-300 mb-4">
              Please login or create an account to access this feature.
            </p>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLoginRegisterClick}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-teal-600"
              >
                Login / Register
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showAuthDialog && (
        <AuthDialog 
          open={showAuthDialog} 
          onClose={handleAuthDialogClose} 
        />
      )}
    </>
  );
}



