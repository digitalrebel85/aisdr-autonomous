'use client';

import { useState } from 'react';

interface DisconnectInboxButtonProps {
  inboxId: number;
  emailAddress: string;
}

export default function DisconnectInboxButton({ inboxId, emailAddress }: DisconnectInboxButtonProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm(`Are you sure you want to disconnect ${emailAddress}?`)) {
      return;
    }

    setIsDisconnecting(true);
    
    try {
      const formData = new FormData();
      formData.append('inboxId', inboxId.toString());
      
      const response = await fetch('/api/nylas/disconnect', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Refresh the page to show updated inbox list
        window.location.reload();
      } else {
        console.error('Failed to disconnect inbox');
        alert('Failed to disconnect inbox. Please try again.');
      }
    } catch (error) {
      console.error('Error disconnecting inbox:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <form onSubmit={handleDisconnect}>
      <button 
        type="submit" 
        disabled={isDisconnecting}
        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </form>
  );
}
