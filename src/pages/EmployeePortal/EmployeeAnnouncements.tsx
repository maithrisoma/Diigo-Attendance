import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Megaphone,
  Pin,
  Search,
  Calendar,
  Tag,
  AlertCircle,
  RefreshCw,
  User,
  Clock
} from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#94A3B8',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Urgent: '#EF4444',
};

export const EmployeeAnnouncements: React.FC = () => {
  const { announcements } = useData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'General', label: 'General' },
    { value: 'Holiday Notice', label: 'Holiday Notice' },
    { value: 'Attendance Update', label: 'Attendance Update' },
    { value: 'Policy Update', label: 'Policy Update' },
    { value: 'Event', label: 'Event' },
    { value: 'Emergency', label: 'Emergency' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
  ];

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPriority('all');
  };

  // Filter and sort announcements
  const processedAnnouncements = useMemo(() => {
    let result = [...announcements];

    // Filter by search query (title or content)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (ann) =>
          ann.title.toLowerCase().includes(q) ||
          ann.content.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((ann) => ann.category === selectedCategory);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      result = result.filter((ann) => ann.priority === selectedPriority);
    }

    // Sort: Pinned first, then by creation date descending
    return result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [announcements, searchQuery, selectedCategory, selectedPriority]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2 text-left">
            <Megaphone className="h-6 w-6 text-primary" />
            Company Announcements
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 text-left">
            Stay informed with the latest updates, holiday alerts, and announcements from management.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-end">
          {/* Search Box */}
          <div className="w-full md:flex-1 relative text-left">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide font-display mb-1.5 block">
              Search Announcements
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="w-full md:w-48 text-left">
            <Select
              label="Filter Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>

          {/* Priority Selector */}
          <div className="w-full md:w-48 text-left">
            <Select
              label="Filter Priority"
              options={priorityOptions}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="w-full md:w-auto h-10 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </CardContent>
      </Card>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {processedAnnouncements.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border border-dashed p-12 text-center text-muted-foreground bg-card">
            <AlertCircle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-semibold">No announcements found</p>
            <p className="text-xs text-muted-foreground mt-1">
              There are no announcements that match your current search and filters.
            </p>
          </div>
        ) : (
          processedAnnouncements.map((ann) => {
            const isUrgent = ann.priority === 'Urgent';
            const isHigh = ann.priority === 'High';
            return (
              <Card
                key={ann.id}
                className={`border transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                  ann.is_pinned
                    ? 'border-primary/50 shadow-sm bg-gradient-to-br from-primary/5 via-card to-card'
                    : 'border-border'
                }`}
              >
                {/* Visual Banner/Border accent for high/urgent priority */}
                {isUrgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                )}
                {isHigh && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                )}

                {/* Pin Icon on Top-Right */}
                {ann.is_pinned && (
                  <div className="absolute top-0 right-0 h-8 w-8 bg-primary/10 rounded-bl-full flex items-center justify-center" title="Pinned to top">
                    <Pin className="h-3 w-3 text-primary rotate-45" />
                  </div>
                )}

                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header: Category & Priority Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/20 border border-border px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {ann.category}
                      </span>
                      <span
                        className="text-[9px] font-extrabold px-2.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: PRIORITY_COLORS[ann.priority] || '#94A3B8' }}
                      >
                        {ann.priority}
                      </span>
                    </div>

                    {/* Announcement Title */}
                    <h3 className="font-bold text-lg text-foreground font-display text-left mb-2 leading-snug">
                      {ann.title}
                    </h3>

                    {/* Announcement Content */}
                    <p className="text-sm text-muted-foreground text-left leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 mt-6 text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground/80" />
                      <span>Published by <strong className="text-foreground">{ann.created_by}</strong></span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                        <span>
                          {new Date(ann.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      
                      {ann.expires_at && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                          <Calendar className="h-3 w-3" />
                          <span>Expires: {new Date(ann.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
