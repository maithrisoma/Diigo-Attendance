import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { RefreshCw, Link2, Unlink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const GoogleCalendarSync: React.FC = () => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    // Check for OAuth callback result in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      setIsConnected(true);
      setSyncResult({ message: 'Google Calendar connected successfully!', type: 'success' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('google') === 'error') {
      setSyncResult({ message: 'Failed to connect Google Calendar. Please try again.', type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/google/status/${currentUser.employee_id}`);
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check Google status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/google/auth-url?employeeId=${currentUser.employee_id}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setSyncResult({ message: data.error || 'Failed to start Google connection.', type: 'error' });
      }
    } catch (err) {
      setSyncResult({ message: 'Failed to start Google connection.', type: 'error' });
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser) return;
    try {
      await fetch(`/api/google/disconnect/${currentUser.employee_id}`, { method: 'DELETE' });
      setIsConnected(false);
      setSyncResult({ message: 'Google Calendar disconnected.', type: 'success' });
    } catch (err) {
      setSyncResult({ message: 'Failed to disconnect.', type: 'error' });
    }
  };

  const handleSync = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/google/sync/${currentUser.employee_id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({
          message: `Synced: ${data.synced.attendance} attendance, ${data.synced.leaves} leaves, ${data.synced.holidays} holidays`,
          type: 'success'
        });
      } else {
        setSyncResult({ message: data.error || 'Sync failed', type: 'error' });
      }
    } catch (err) {
      setSyncResult({ message: 'Failed to sync with Google Calendar.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1967D2"/>
            <path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#188038"/>
            <path d="M18.316 24V18.316H5.684V24h12.632z" fill="#1967D2"/>
            <path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#EA4335"/>
            <path d="M18.316 5.684H24V0h-5.684v5.684z" fill="#1A73E8"/>
            <path d="M18.316 18.316H24V24h-5.684v-5.684z" fill="#34A853"/>
            <path d="M0 18.316h5.684V24H0v-5.684z" fill="#0D652D"/>
            <path d="M0 0h5.684v5.684H0V0z" fill="#FBBC04"/>
          </svg>
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-700">Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Not connected</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isConnected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect Google Calendar
            </Button>
          )}
        </div>

        {/* Sync Result Message */}
        {syncResult && (
          <div className={`text-xs p-2 rounded-md ${
            syncResult.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncResult.message}
          </div>
        )}

        {/* Info text */}
        <p className="text-xs text-gray-400">
          {isConnected 
            ? 'Sync your attendance, leaves, and holidays to Google Calendar.'
            : 'Connect to push attendance events to your Google Calendar.'}
        </p>
      </CardContent>
    </Card>
  );
};
