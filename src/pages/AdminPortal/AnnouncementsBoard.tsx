import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  Megaphone,
  Pin,
  Trash2,
  Edit,
  Archive,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Calendar,
  Send,
  RefreshCw
} from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#94A3B8',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Urgent: '#EF4444',
};

export const AnnouncementsBoard: React.FC = () => {
  const { announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, employees } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.role === 'admin';

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Low');
  const [audienceType, setAudienceType] = useState('All Employees');
  const [specificDept, setSpecificDept] = useState('Engineering');
  const [specificEmployeeIds, setSpecificEmployeeIds] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown options
  const categoryOptions = [
    { value: 'General', label: 'General' },
    { value: 'Holiday Notice', label: 'Holiday Notice' },
    { value: 'Attendance Update', label: 'Attendance Update' },
    { value: 'Policy Update', label: 'Policy Update' },
    { value: 'Event', label: 'Event' },
    { value: 'Emergency', label: 'Emergency' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
  ];

  const audienceOptions = [
    { value: 'All Employees', label: 'All Employees' },
    { value: 'HR Only', label: 'HR Only' },
    { value: 'Specific Department', label: 'Specific Department' },
    { value: 'Specific Employees', label: 'Specific Employees' },
  ];

  const deptOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
  ];

  // Helper to compile target audience
  const getTargetAudienceString = () => {
    if (audienceType === 'Specific Department') {
      return `Department: ${specificDept}`;
    }
    if (audienceType === 'Specific Employees') {
      return `Employee: ${specificEmployeeIds}`;
    }
    return audienceType;
  };

  const parseAudienceString = (aud: string) => {
    if (aud.startsWith('Department:')) {
      setAudienceType('Specific Department');
      setSpecificDept(aud.replace('Department:', '').trim());
    } else if (aud.startsWith('Employee:')) {
      setAudienceType('Specific Employees');
      setSpecificEmployeeIds(aud.replace('Employee:', '').trim());
    } else {
      setAudienceType(aud);
    }
  };

  // Sort: Pinned first, then Pinned/Active/Urgent, then Created Date
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // Active status
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;

      // Urgent priority
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
      if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;

      // Date order
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [announcements]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!content.trim()) errs.content = 'Content is required';
    if (audienceType === 'Specific Employees' && !specificEmployeeIds.trim()) {
      errs.employees = 'Employee IDs are required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setCategory('General');
    setPriority('Low');
    setAudienceType('All Employees');
    setSpecificDept('Engineering');
    setSpecificEmployeeIds('');
    setExpiryDate('');
    setIsActive(true);
    setIsPinned(false);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent, publish = true) => {
    e.preventDefault();
    if (!validateForm()) return;

    const targetAudience = getTargetAudienceString();
    const annData = {
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      target_audience: targetAudience,
      created_by: currentUser?.name || 'Unknown',
      expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      is_active: publish,
      is_pinned: isPinned,
    };

    if (editingId) {
      await updateAnnouncement(editingId, annData);
      toast('Announcement updated successfully!', 'success');
    } else {
      await addAnnouncement(annData);
      toast(publish ? 'Announcement published!' : 'Announcement saved as draft!', 'success');
    }

    handleReset();
  };

  const handleEditClick = (ann: any) => {
    // HR can only edit own announcements
    if (!isSuperAdmin && ann.created_by !== currentUser?.name) {
      toast('You can only edit your own announcements.', 'error');
      return;
    }

    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setCategory(ann.category);
    setPriority(ann.priority);
    parseAudienceString(ann.target_audience);
    setExpiryDate(ann.expires_at ? ann.expires_at.split('T')[0] : '');
    setIsActive(ann.is_active);
    setIsPinned(ann.is_pinned);
  };

  const handleDeleteClick = async (ann: any) => {
    if (!isSuperAdmin && ann.created_by !== currentUser?.name) {
      toast('You can only delete your own announcements.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${ann.title}"?`)) {
      await removeAnnouncement(ann.id);
      toast('Announcement removed.', 'success');
      if (editingId === ann.id) {
        handleReset();
      }
    }
  };

  const handlePinToggle = async (ann: any) => {
    if (!isSuperAdmin && ann.created_by !== currentUser?.name) {
      toast('You can only pin/unpin your own announcements.', 'error');
      return;
    }
    await updateAnnouncement(ann.id, { is_pinned: !ann.is_pinned });
    toast(ann.is_pinned ? 'Announcement unpinned!' : 'Announcement pinned!', 'success');
  };

  const handleArchiveToggle = async (ann: any) => {
    if (!isSuperAdmin && ann.created_by !== currentUser?.name) {
      toast('You can only archive/activate your own announcements.', 'error');
      return;
    }
    const nextActive = !ann.is_active;
    await updateAnnouncement(ann.id, { is_active: nextActive });
    toast(nextActive ? 'Announcement published!' : 'Announcement archived!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Announcements Board
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Publish and manage official notices and alerts for employees. Pinned notices appear first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section (70%): Create/Edit Form */}
        <div className="lg:col-span-8">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b border-border bg-muted/5 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => handleSubmit(e, isActive)} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    label="Announcement Title"
                    placeholder="e.g. Annual Company Picnic Next Friday"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Announcement Content
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Write detailed announcements content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ${
                      errors.content ? 'border-red-500 focus:ring-red-200' : 'border-border'
                    }`}
                  />
                  {errors.content && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.content}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Announcement Category"
                    options={categoryOptions}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />

                  <Select
                    label="Priority Level"
                    options={priorityOptions}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Target Audience"
                    options={audienceOptions}
                    value={audienceType}
                    onChange={(e) => setAudienceType(e.target.value)}
                  />

                  <DatePicker
                    label="Expiry Date (Optional)"
                    placeholder="Select expiry date"
                    value={expiryDate}
                    onChange={(val) => setExpiryDate(val)}
                  />
                </div>

                {/* Sub-audience forms */}
                {audienceType === 'Specific Department' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <Select
                      label="Select Target Department"
                      options={deptOptions}
                      value={specificDept}
                      onChange={(e) => setSpecificDept(e.target.value)}
                    />
                  </div>
                )}

                {audienceType === 'Specific Employees' && (
                  <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      label="Employee IDs (comma-separated)"
                      placeholder="e.g. EMP001, EMP002, EMP006"
                      value={specificEmployeeIds}
                      onChange={(e) => setSpecificEmployeeIds(e.target.value)}
                      error={errors.employees}
                    />
                    <span className="text-[10px] text-muted-foreground font-semibold leading-normal block">
                      Target specific staff members by comma separating their unique IDs.
                    </span>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex flex-wrap gap-6 items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                      Pin to Top
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Active (Publish immediately)
                    </span>
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => handleSubmit(e, false)}>
                    Save Draft
                  </Button>
                  <Button type="submit" size="sm" className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {editingId ? 'Save Changes' : 'Publish Notice'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Section (30%): Live List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Megaphone className="h-4 w-4" />
            Registry Board ({sortedAnnouncements.length})
          </h2>

          <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            {sortedAnnouncements.length === 0 ? (
              <div className="rounded-xl border border-border border-dashed p-8 text-center text-muted-foreground bg-card text-xs">
                No announcements published yet. Fill the left form to release a notice.
              </div>
            ) : (
              sortedAnnouncements.map((ann) => (
                <Card
                  key={ann.id}
                  className={`border transition-all duration-300 hover:shadow-md relative overflow-hidden ${
                    ann.is_pinned ? 'border-primary/40 shadow-sm' : 'border-border'
                  }`}
                >
                  {ann.is_pinned && (
                    <div className="absolute top-0 right-0 h-8 w-8 bg-primary/10 rounded-bl-full flex items-center justify-center">
                      <Pin className="h-3 w-3 text-primary rotate-45" />
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    {/* Meta info & Category */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/15 border border-border px-2 py-0.5 rounded-full">
                        {ann.category}
                      </span>
                      <span
                        className="text-[9px] font-extrabold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: PRIORITY_COLORS[ann.priority] || '#94A3B8' }}
                      >
                        {ann.priority}
                      </span>
                    </div>

                    {/* Title & Content */}
                    <div className="space-y-1 text-left">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 pr-4 font-display">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>

                    {/* Target & Poster info */}
                    <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-semibold border-t border-border/60 pt-2 text-left">
                      <div className="flex justify-between">
                        <span>Audience:</span>
                        <span className="text-foreground">{ann.target_audience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>By:</span>
                        <span className="text-foreground">{ann.created_by}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="text-foreground">
                          {new Date(ann.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span>Status:</span>
                        <Badge variant={ann.is_active ? 'success' : 'secondary'} className="text-[9px] font-bold px-1.5 py-0">
                          {ann.is_active ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex justify-end items-center gap-1.5 border-t border-border/40 pt-2.5">
                      <button
                        onClick={() => handlePinToggle(ann)}
                        className={`p-1.5 rounded-lg border transition ${
                          ann.is_pinned
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                        title={ann.is_pinned ? 'Unpin Announcement' : 'Pin Announcement'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleArchiveToggle(ann)}
                        className={`p-1.5 rounded-lg border transition ${
                          ann.is_active
                            ? 'border-rose-100 text-rose-500 hover:bg-rose-500/10'
                            : 'border-emerald-100 text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={ann.is_active ? 'Archive Announcement' : 'Publish Announcement'}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleEditClick(ann)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/5 transition"
                        title="Edit Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(ann)}
                        className="p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Notice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
