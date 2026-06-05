import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import {
  Bell,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Megaphone,
  PlaneTakeoff,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Leave Approval':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'Leave Rejection':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'Leave Request':
        return <PlaneTakeoff className="h-5 w-5 text-orange-500" />;
      case 'Holiday Notice':
        return <CalendarCheck className="h-5 w-5 text-blue-500" />;
      case 'New Announcement':
      case 'Policy Update':
        return <Megaphone className="h-5 w-5 text-indigo-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-card border-border';
    switch (type) {
      case 'Leave Approval':
        return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30';
      case 'Leave Rejection':
        return 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30';
      case 'Leave Request':
        return 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30';
      case 'Holiday Notice':
        return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30';
      case 'New Announcement':
      case 'Policy Update':
        return 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30';
      default:
        return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
    }
  };

  const handleNotificationClick = async (not: any) => {
    if (!not.is_read) {
      await markNotificationRead(not.id);
    }

    const role = currentUser?.role;
    const type = not.type;

    if (type === 'Leave Approval' || type === 'Leave Rejection') {
      if (role === 'admin') navigate('/admin/leaves');
      else if (role === 'hr') navigate('/hr/leaves');
      else navigate('/employee/leaves');
    } else if (type === 'Leave Request') {
      if (role === 'admin') navigate('/admin/leaves');
      else if (role === 'hr') navigate('/hr/leaves');
      else navigate('/employee/leaves');
    } else if (type === 'Holiday Notice') {
      if (role === 'admin') navigate('/admin/holidays');
      else if (role === 'hr') navigate('/hr/holidays');
      else navigate('/employee/calendar');
    } else {
      if (role === 'admin') navigate('/admin/announcements');
      else if (role === 'hr') navigate('/hr/announcements');
      else navigate('/employee/announcements');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay updated with leave requests, approvals, holidays, and announcements.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Notifications will appear here when there are updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((not) => (
            <div
              key={not.id}
              onClick={() => handleNotificationClick(not)}
              className={`relative flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.005] ${getBg(not.type, not.is_read)}`}
            >
              {/* Unread dot */}
              {!not.is_read && (
                <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}

              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(not.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold truncate ${not.is_read ? 'text-foreground/70' : 'text-foreground'}`}>
                    {not.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    not.type === 'Leave Approval' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    not.type === 'Leave Rejection' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    not.type === 'Leave Request' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    not.type === 'Holiday Notice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  }`}>
                    {not.type}
                  </span>
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${not.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                  {not.message}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground/60">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(not.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
