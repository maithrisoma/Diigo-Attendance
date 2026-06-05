import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Bell, CheckCircle2, AlertCircle, CalendarDays, Clock, ShieldCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { activities } = useData();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'check_in':
      case 'check_out':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'leave_approve':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'leave_reject':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'employee_add':
      case 'employee_edit':
      case 'employee_remove':
      default:
        return <ShieldCheck className="h-5 w-5 text-indigo-500" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'leave_approve':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'leave_reject':
        return 'bg-rose-500/10 border-rose-500/20';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Notifications & System Alerts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View all recent system alerts, leave applications, check-in reports, and holiday updates.
        </p>
      </div>

      {/* Notifications feed */}
      <Card className="hover:shadow-sm transition-all duration-300">
        <CardHeader className="border-b border-border bg-muted/5 flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Activity Timeline</CardTitle>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{activities.length} Total Alerts</span>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative border-l border-border pl-6 space-y-6 ml-3">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No alerts logged in the system.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[37px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                    {getAlertIcon(act.type)}
                  </span>
                  
                  {/* Notification Content Box */}
                  <div className={`p-4 border rounded-xl shadow-xs space-y-1.5 transition hover:shadow-md ${getAlertBg(act.type)}`}>
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-semibold text-foreground leading-normal">
                        {act.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 flex-shrink-0">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(act.timestamp).toLocaleDateString()}{' '}
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">Triggered by:</span>
                      <span>{act.user_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
