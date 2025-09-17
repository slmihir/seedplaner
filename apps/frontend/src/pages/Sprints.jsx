import { useEffect, useState, useMemo } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, List, ListItem, ListItemText, MenuItem, Select, FormControl, InputLabel, Chip, Stack, Divider, LinearProgress, IconButton, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Avatar, Tabs, Tab, Grid, Paper, FormLabel, RadioGroup, FormControlLabel, Radio, Menu, ListItemIcon, ListItemText as MuiListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import api from '../api/client';
import SprintBoard from '../components/SprintBoard';
import IssuesTable from '../components/IssuesTable';
import IssuesFilters from '../components/IssuesFilters';
import IssuesBulkActions from '../components/IssuesBulkActions';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomFields from '../components/CustomFields';
import DailyStatusIndicator from '../components/DailyStatusIndicator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exportToPDF, exportToCSV, exportToExcel, printReport } from '../utils/exportUtils';

export default function Sprints() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ project: '', name: '', startDate: '', endDate: '' });
  const [selectedProject, setSelectedProject] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [summary, setSummary] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', sprintId: '', sprintName: '' });
  const [sprintDialog, setSprintDialog] = useState({ open: false, sprint: null });
  const [sprintCompletionDialog, setSprintCompletionDialog] = useState({ 
    open: false, 
    sprint: null, 
    completedIssues: [], 
    incompleteIssues: [], 
    totalIssues: 0,
    transferOption: 'backlog', // 'next', 'backlog', 'specific'
    statusHandling: 'keep', // 'keep', 'reset'
    targetSprint: '', // for 'specific' option
    availableSprints: [] // for 'specific' option
  });
  const [sprintReportDialog, setSprintReportDialog] = useState({ 
    open: false, 
    report: null, 
    sprint: null 
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // CRUD Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [viewingIssue, setViewingIssue] = useState(null);
  
  // Form state
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    assignees: [],
    storyPoints: ''
  });
  
  // Table state
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.get('/projects'), api.get('/sprints')]);
      setProjects(p.data.projects);
      setSprints(s.data.sprints);
      
      // Set default project if none selected
      if (!selectedProject && p.data.projects.length > 0) {
        const defaultProject = p.data.projects[0];
        setSelectedProject(defaultProject._id);
        setForm(prevForm => ({ ...prevForm, project: defaultProject._id }));
        // Load sprints and issues for the default project
        try {
          const [sprintsRes, issuesRes] = await Promise.all([
            api.get(`/sprints?project=${defaultProject._id}`),
            api.get(`/issues?project=${defaultProject._id}`)
          ]);
          setSprints(sprintsRes.data.sprints);
          setIssues(issuesRes.data.issues);
        } catch (err) {
          console.warn('Failed to load default project data:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSprint = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sprints', { name: form.name, project: form.project, startDate: form.startDate, endDate: form.endDate });
      setForm({ ...form, name: '', startDate: '', endDate: '' });
      // Reload sprints for the current project
      if (form.project) {
        loadSprintsForProject(form.project);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint');
    }
  };

  const loadIssuesForProject = async (projectId) => {
    try {
      const res = await api.get(`/issues?project=${projectId}`);
      setIssues(res.data.issues);
    } catch (_) {
      setIssues([]);
    }
  };

  const loadSprintsForProject = async (projectId) => {
    try {
      const res = await api.get(`/sprints?project=${projectId}`);
      setSprints(res.data.sprints);
    } catch (_) {
      setSprints([]);
    }
  };

  const loadSprintSummary = async (sprintId) => {
    if (!sprintId) return;
    try {
      const res = await api.get(`/sprints/${sprintId}/summary`);
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sprint summary');
      setSummary(null);
    }
  };

  useEffect(() => {
    if (selectedSprint) loadSprintSummary(selectedSprint);
  }, [selectedSprint]);

  // Listen for issues data changes from other tabs
  useEffect(() => {
    const handleIssuesDataChanged = (event) => {
      const { action, projectId } = event.detail;
      // Reload data when issues are updated
      if (action === 'update' || action === 'create' || action === 'delete') {
        load();
        if (selectedSprint) {
          loadSprintSummary(selectedSprint);
        }
      }
    };

    window.addEventListener('issuesDataChanged', handleIssuesDataChanged);
    
    return () => {
      window.removeEventListener('issuesDataChanged', handleIssuesDataChanged);
    };
  }, [selectedSprint]);

  const projectIssuesNotInSprint = useMemo(() => {
    if (!summary) return issues;
    const inSprintIds = new Set(
      Object.values(summary.groups || {})
        .flat()
        .map((i) => i._id)
    );
    return issues.filter((i) => !inSprintIds.has(i._id));
  }, [issues, summary]);

  const addIssueToSprint = async (issueId) => {
    if (!selectedSprint) return;
    try {
      await api.post(`/sprints/${selectedSprint}/issues/${issueId}`);
      await loadSprintSummary(selectedSprint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add issue to sprint');
    }
  };

  const removeIssueFromSprint = async (issueId) => {
    if (!selectedSprint) return;
    try {
      await api.delete(`/sprints/${selectedSprint}/issues/${issueId}`);
      await loadSprintSummary(selectedSprint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove issue from sprint');
    }
  };

  const startSprint = async () => {
    if (!selectedSprint) return;
    const sprint = sprints.find(s => s._id === selectedSprint);
    setConfirmDialog({
      open: true,
      action: 'start',
      sprintId: selectedSprint,
      sprintName: sprint?.name || 'Sprint'
    });
  };

  const completeSprint = async () => {
    if (!selectedSprint) return;
    const sprint = sprints.find(s => s._id === selectedSprint);
    
    // Load sprint issues for completion analysis
    try {
      const res = await api.get(`/issues?sprint=${selectedSprint}`);
      const sprintIssues = res.data.issues || [];
      
      // Analyze completion status
      const completedIssues = sprintIssues.filter(issue => 
        issue.status === 'completed' || issue.status === 'released' || issue.status === 'done'
      );
      const incompleteIssues = sprintIssues.filter(issue => 
        !['completed', 'released', 'done'].includes(issue.status)
      );
      
      // Get available sprints for transfer (same project, not completed, not current sprint)
      const availableSprints = sprints.filter(s => 
        s.project === sprint.project && 
        !s.completedAt && 
        s._id !== selectedSprint
      );
      
      setSprintCompletionDialog({
        open: true,
        sprint: sprint,
        completedIssues: completedIssues,
        incompleteIssues: incompleteIssues,
        totalIssues: sprintIssues.length,
        transferOption: 'backlog',
        statusHandling: 'keep',
        targetSprint: '',
        availableSprints: availableSprints
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sprint issues for completion');
    }
  };

  const handleConfirmAction = async () => {
    const { action, sprintId } = confirmDialog;
    try {
      if (action === 'start') {
        await api.post(`/sprints/${sprintId}/start`);
      } else if (action === 'complete') {
        await api.post(`/sprints/${sprintId}/complete`);
      }
      await loadSprintSummary(sprintId);
      setConfirmDialog({ open: false, action: '', sprintId: '', sprintName: '' });
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} sprint`);
    }
  };

  const handleSprintCompletion = async () => {
    const { sprint, incompleteIssues, transferOption, statusHandling, targetSprint } = sprintCompletionDialog;
    
    try {
      // First, complete the sprint using existing API
      await api.post(`/sprints/${sprint._id}/complete`);
      
      // Handle incomplete issues based on transfer option
      if (incompleteIssues.length > 0) {
        for (const issue of incompleteIssues) {
          let updateData = {};
          
          // Determine target sprint
          if (transferOption === 'next') {
            // Find next sprint (earliest start date after current sprint)
            const nextSprint = sprintCompletionDialog.availableSprints
              .filter(s => new Date(s.startDate) > new Date(sprint.endDate))
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
            if (nextSprint) {
              updateData.sprint = nextSprint._id;
            } else {
              // No next sprint available, move to backlog
              updateData.sprint = null;
            }
          } else if (transferOption === 'specific' && targetSprint) {
            updateData.sprint = targetSprint;
          } else {
            // transferOption === 'backlog' or no target sprint
            updateData.sprint = null;
          }
          
          // Handle status based on statusHandling option
          if (statusHandling === 'reset') {
            updateData.status = 'backlog';
          }
          
          // Update the issue
          await api.patch(`/issues/${issue._id}`, updateData);
        }
      }
      
      // Generate sprint report
      try {
        const reportRes = await api.post(`/sprint-reports/generate/${sprint._id}`);
        const report = reportRes.data.report;
        
        // Show sprint report dialog
        setSprintReportDialog({
          open: true,
          report: report,
          sprint: sprint
        });
      } catch (reportErr) {
        console.warn('Failed to generate sprint report:', reportErr);
        // Continue with completion even if report generation fails
      }
      
      // Close completion dialog and refresh data
      setSprintCompletionDialog({ ...sprintCompletionDialog, open: false });
      await load(); // Refresh sprints list
      if (selectedSprint) {
      await loadSprintSummary(selectedSprint);
      }
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'sprint_completed', 
          projectId: sprint.project 
        } 
      }));
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sprint');
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: '', sprintId: '', sprintName: '' });
  };

  const openSprintDialog = (sprint) => {
    setSprintDialog({ open: true, sprint });
    setSelectedSprint(sprint._id);
    loadSprintSummary(sprint._id);
  };

  const closeSprintDialog = () => {
    setSprintDialog({ open: false, sprint: null });
    setSelectedSprint('');
    setSummary(null);
    setActiveTab(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExportReport = async (format = 'pdf') => {
    if (!sprintReportDialog.report) {
      setError('No report data available for export');
      return;
    }

    try {
      const reportData = {
        sprintName: sprintReportDialog.report.sprintName,
        startDate: sprintReportDialog.report.startDate,
        endDate: sprintReportDialog.report.endDate,
        generatedAt: sprintReportDialog.report.generatedAt,
        totalIssues: sprintReportDialog.report.totalIssues,
        completedIssues: sprintReportDialog.report.completedIssues,
        inProgressIssues: sprintReportDialog.report.inProgressIssues,
        notStartedIssues: sprintReportDialog.report.notStartedIssues,
        totalStoryPoints: sprintReportDialog.report.totalStoryPoints,
        completedStoryPoints: sprintReportDialog.report.completedStoryPoints,
        velocity: sprintReportDialog.report.velocity,
        totalEstimatedHours: sprintReportDialog.report.totalEstimatedHours,
        totalActualHours: sprintReportDialog.report.totalActualHours,
        effortVariance: sprintReportDialog.report.effortVariance,
        sprintHealth: sprintReportDialog.report.sprintHealth,
        teamMembers: sprintReportDialog.report.teamMembers,
        issueTypeBreakdown: sprintReportDialog.report.issueTypeBreakdown,
        statusBreakdown: sprintReportDialog.report.statusBreakdown
      };

      let result;
      switch (format) {
        case 'pdf':
          result = await exportToPDF(reportData, 'sprint-report-content');
          break;
        case 'csv':
          result = exportToCSV(reportData);
          break;
        case 'excel':
          result = exportToExcel(reportData);
          break;
        case 'print':
          result = printReport('sprint-report-content');
          break;
        default:
          setError('Invalid export format');
          return;
      }

      if (result.success) {
        // Show success message (you could add a snackbar here)
        console.log(`Report exported successfully: ${result.fileName || 'Printed'}`);
      } else {
        setError(result.error || 'Failed to export report');
      }
    } catch (err) {
      setError('Failed to export report: ' + err.message);
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportOption = (format) => {
    handleExportReport(format);
    handleExportMenuClose();
  };

  const handleIssueUpdate = () => {
    // Refresh sprint summary when issue is updated
    if (selectedSprint) {
      loadSprintSummary(selectedSprint);
    }
  };

  const openSprintBoard = (sprintId) => {
    navigate(`/sprints/${sprintId}/board`);
  };

  // CRUD Operations for Issues
  const handleCreateIssue = async () => {
    try {
      // Extract custom fields dynamically
      const { title, description, type, priority, assignees, storyPoints, ...customFields } = issueForm;
      
      await api.post('/issues', {
        title,
        description,
        type,
        priority,
        assignees,
        storyPoints,
        project: sprintDialog.sprint.project,
        sprint: sprintDialog.sprint._id,
        status: 'backlog',
        ...customFields // Include custom fields
      });
      setCreateDialogOpen(false);
      setIssueForm({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assignees: [],
        storyPoints: ''
      });
      // Refresh sprint summary
      if (selectedSprint) {
        loadSprintSummary(selectedSprint);
      }
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'create', 
          projectId: sprintDialog.sprint.project 
        } 
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    }
  };

  const handleEditIssue = async () => {
    try {
      // Extract custom fields dynamically
      const { title, description, type, priority, assignees, storyPoints, ...customFields } = issueForm;
      
      await api.patch(`/issues/${editingIssue._id}`, {
        title,
        description,
        type,
        priority,
        assignees,
        storyPoints,
        ...customFields // Include custom fields
      });
      setEditDialogOpen(false);
      setEditingIssue(null);
      setIssueForm({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assignees: [],
        storyPoints: ''
      });
      // Refresh sprint summary
      if (selectedSprint) {
        loadSprintSummary(selectedSprint);
      }
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'update', 
          projectId: editingIssue.project || sprintDialog.sprint?.project 
        } 
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleDeleteIssue = async (issue) => {
    try {
      await api.delete(`/issues/${issue._id}`);
      // Refresh sprint summary
      if (selectedSprint) {
        loadSprintSummary(selectedSprint);
      }
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'delete', 
          projectId: issue.project 
        } 
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const openEditDialog = (issue) => {
    setEditingIssue(issue);
    setIssueForm({
      title: issue.title || '',
      description: issue.description || '',
      type: issue.type || 'task',
      priority: issue.priority || 'medium',
      assignees: issue.assignees ? issue.assignees.map(a => a._id || a) : [],
      storyPoints: issue.storyPoints || '',
      // Include custom fields
      sprint: issue.sprint || '',
      acceptanceCriteria: issue.acceptanceCriteria || '',
      testPlan: issue.testPlan || '',
      startDate: issue.startDate || '',
      endDate: issue.endDate || '',
      estimate: issue.estimate || '',
      actual: {
        date: issue.actual?.date || '',
        hours: issue.actual?.hours || ''
      }
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (issue) => {
    setViewingIssue(issue);
    setViewDialogOpen(true);
  };

  const handleBulkAction = async (action, data) => {
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedItems.map(id => api.delete(`/issues/${id}`)));
          break;
        case 'assign':
          await Promise.all(selectedItems.map(id => 
            api.patch(`/issues/${id}`, { assignees: data.assignees })
          ));
          break;
        case 'status':
          await Promise.all(selectedItems.map(id => 
            api.patch(`/issues/${id}`, { status: data.status })
          ));
          break;
        case 'priority':
          await Promise.all(selectedItems.map(id => 
            api.patch(`/issues/${id}`, { priority: data.priority })
          ));
          break;
        default:
          break;
      }
      setSelectedItems([]);
      // Refresh sprint summary
      if (selectedSprint) {
        loadSprintSummary(selectedSprint);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    }
  };


  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Sprints</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={createSprint} sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="project-label">Project</InputLabel>
          <Select labelId="project-label" label="Project" value={form.project} onChange={(e) => { 
            const projectId = e.target.value;
            setForm({ ...form, project: projectId }); 
            setSelectedProject(projectId);
            loadSprintsForProject(projectId);
            loadIssuesForProject(projectId);
            setSelectedSprint(''); // Clear selected sprint when switching projects
            setSummary(null); // Clear summary when switching projects
          }} required>
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextField type="date" label="Start" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
        <TextField type="date" label="End" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        <Button type="submit" variant="contained">Create</Button>
      </Box>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Sprints</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {sprints.map((s) => (
              <Card 
                key={s._id} 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedSprint === s._id ? '2px solid' : '1px solid',
                  borderColor: selectedSprint === s._id ? 'primary.main' : 'divider',
                  bgcolor: selectedSprint === s._id ? 'action.selected' : 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => openSprintDialog(s)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: s.isActive ? 'success.main' : s.completedAt ? 'info.main' : 'grey.400'
                    }}>
                      {s.isActive ? <PlayArrowIcon /> : s.completedAt ? <CheckCircleIcon /> : <ScheduleIcon />}
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {s.name}
                    </Typography>
                    {s.isActive && (
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small" 
                        icon={<PlayArrowIcon />}
                      />
                    )}
                    {s.completedAt && (
                      <Chip 
                        label="Completed" 
                        color="info" 
                        size="small" 
                        icon={<CheckCircleIcon />}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'Not started'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'No end date'}
                  </Typography>
                  {s.goal && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Goal: {s.goal}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSprintBoard(s._id);
                    }}
                  >
                    View Board
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </>
      )}
      
      {/* Sprint Details Dialog */}
      <Dialog 
        open={sprintDialog.open} 
        onClose={closeSprintDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: sprintDialog.sprint?.isActive ? 'success.main' : sprintDialog.sprint?.completedAt ? 'info.main' : 'grey.400'
              }}>
                {sprintDialog.sprint?.isActive ? <PlayArrowIcon /> : sprintDialog.sprint?.completedAt ? <CheckCircleIcon /> : <ScheduleIcon />}
              </Avatar>
              <Box>
                <Typography variant="h5" component="div">
                  {sprintDialog.sprint?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sprintDialog.sprint?.startDate ? new Date(sprintDialog.sprint.startDate).toLocaleDateString() : 'Not started'} → {sprintDialog.sprint?.endDate ? new Date(sprintDialog.sprint.endDate).toLocaleDateString() : 'No end date'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={startSprint} 
                disabled={summary?.sprint?.isActive}
                size="small"
              >
                Start Sprint
              </Button>
              <Button 
                variant="contained" 
                color="warning"
                startIcon={<StopIcon />}
                onClick={completeSprint} 
                disabled={!summary?.sprint?.isActive}
                size="small"
              >
                Complete Sprint
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {summary && (
            <Box>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="sprint tabs">
                  <Tab icon={<DashboardIcon />} label="Overview" />
                  <Tab icon={<ViewKanbanIcon />} label="Sprint Board" />
                  <Tab icon={<ViewListIcon />} label="Issues" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              {activeTab === 0 && (
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Sprint Progress */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Sprint Progress</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={summary.total ? Math.round((summary.done / summary.total) * 100) : 0} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="h6" color="primary">
                        {summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {summary.done} completed • {summary.total - summary.done} remaining • {summary.total} total issues
                    </Typography>
                  </Box>

                  {/* Sprint Status */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Sprint Status</Typography>
                    <Stack direction="row" spacing={2}>
                      {summary.sprint.isActive && (
                        <Chip 
                          label="Currently Active" 
                          color="success" 
                          icon={<PlayArrowIcon />}
                          variant="filled"
                        />
                      )}
                      {summary.sprint.completedAt && (
                        <Chip 
                          label={`Completed on ${new Date(summary.sprint.completedAt).toLocaleDateString()}`} 
                          color="info" 
                          icon={<CheckCircleIcon />}
                          variant="filled"
                        />
                      )}
                      {!summary.sprint.isActive && !summary.sprint.completedAt && (
                        <Chip 
                          label="Not Started" 
                          color="default" 
                          icon={<ScheduleIcon />}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Issues by Status */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Issues by Status</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                {Object.entries(summary.groups || {}).map(([status, items]) => (
                        <Card key={status} variant="outlined">
                          <CardContent sx={{ pb: 1 }}>
                            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', mb: 1, fontWeight: 'bold' }}>
                              {status.replace('_', ' ')} ({items?.length || 0})
                            </Typography>
                            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {(items || []).map((i) => (
                                <ListItem 
                                  key={i._id} 
                                  secondaryAction={
                                    <IconButton 
                                      edge="end" 
                                      aria-label="remove" 
                                      onClick={() => removeIssueFromSprint(i._id)}
                                      size="small"
                                    >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                                  }
                                  sx={{ px: 0 }}
                                >
                                  <ListItemText 
                                    primary={
                                      <Typography variant="body2" fontWeight="medium">
                                        {i.key} — {i.title}
                                      </Typography>
                                    } 
                                    secondary={
                                      <Box component="span" sx={{ mt: 0.5, display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Typography 
                                          component="span" 
                                          variant="caption" 
                                          sx={{ 
                                            px: 1, 
                                            py: 0.25, 
                                            borderRadius: 1, 
                                            border: '1px solid', 
                                            borderColor: 'divider', 
                                            bgcolor: 'background.paper',
                                            color: 'text.secondary'
                                          }}
                                        >
                                          {i.type}
                                        </Typography>
                                        <Typography 
                                          component="span" 
                                          variant="caption" 
                                          sx={{ 
                                            px: 1, 
                                            py: 0.25, 
                                            borderRadius: 1, 
                                            border: '1px solid', 
                                            borderColor: i.priority === 'high' ? 'error.main' : i.priority === 'medium' ? 'warning.main' : 'divider',
                                            bgcolor: i.priority === 'high' ? 'error.light' : i.priority === 'medium' ? 'warning.light' : 'background.paper',
                                            color: i.priority === 'high' ? 'error.dark' : i.priority === 'medium' ? 'warning.dark' : 'text.secondary'
                                          }}
                                        >
                                          {i.priority}
                                        </Typography>
                                      </Box>
                                    } 
                                  />
                        </ListItem>
                      ))}
                    </List>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>

                  {/* Available Issues to Add */}
                  <Box>
                    <Typography variant="h6" gutterBottom>Available Issues to Add</Typography>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {projectIssuesNotInSprint.map((i) => (
                            <ListItem 
                              key={i._id} 
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  aria-label="add" 
                                  onClick={() => addIssueToSprint(i._id)}
                                  size="small"
                                  color="primary"
                                >
                      <AddIcon />
                    </IconButton>
                              }
                              sx={{ px: 0 }}
                            >
                              <ListItemText 
                                primary={
                                  <Typography variant="body2" fontWeight="medium">
                                    {i.key} — {i.title}
                                  </Typography>
                                } 
                                secondary={
                                  <Box component="span" sx={{ mt: 0.5, display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Typography 
                                      component="span" 
                                      variant="caption" 
                                      sx={{ 
                                        px: 1, 
                                        py: 0.25, 
                                        borderRadius: 1, 
                                        border: '1px solid', 
                                        borderColor: 'divider', 
                                        bgcolor: 'background.paper',
                                        color: 'text.secondary'
                                      }}
                                    >
                                      {i.status}
                                    </Typography>
                                    <Typography 
                                      component="span" 
                                      variant="caption" 
                                      sx={{ 
                                        px: 1, 
                                        py: 0.25, 
                                        borderRadius: 1, 
                                        border: '1px solid', 
                                        borderColor: 'divider', 
                                        bgcolor: 'background.paper',
                                        color: 'text.secondary'
                                      }}
                                    >
                                      {i.type}
                                    </Typography>
                                    <Typography 
                                      component="span" 
                                      variant="caption" 
                                      sx={{ 
                                        px: 1, 
                                        py: 0.25, 
                                        borderRadius: 1, 
                                        border: '1px solid', 
                                        borderColor: i.priority === 'high' ? 'error.main' : i.priority === 'medium' ? 'warning.main' : 'divider',
                                        bgcolor: i.priority === 'high' ? 'error.light' : i.priority === 'medium' ? 'warning.light' : 'background.paper',
                                        color: i.priority === 'high' ? 'error.dark' : i.priority === 'medium' ? 'warning.dark' : 'text.secondary'
                                      }}
                                    >
                                      {i.priority}
                                    </Typography>
                                  </Box>
                                } 
                              />
                  </ListItem>
                ))}
                          {projectIssuesNotInSprint.length === 0 && (
                            <ListItem>
                              <ListItemText 
                                primary="No available issues to add" 
                                secondary="All project issues are already assigned to this sprint"
                              />
                            </ListItem>
                          )}
              </List>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ height: '70vh', overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Sprint Board</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<ViewKanbanIcon />}
                      onClick={() => navigate(`/board?project=${sprintDialog.sprint?.project}&sprint=${sprintDialog.sprint?._id}`)}
                      size="small"
                    >
                      Open Full Board
                    </Button>
                  </Box>
                  <SprintBoard 
                    sprintId={selectedSprint} 
                    sprint={sprintDialog.sprint}
                    onIssueUpdate={handleIssueUpdate}
                    currentUserId={user?.id}
                  />
                </Box>
              )}

              {activeTab === 2 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Issues in Sprint</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateDialogOpen(true)}
                      size="small"
                    >
                      Create Issue
                    </Button>
                  </Box>
                  
                  {/* Issues Filters */}
                  <IssuesFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filters={filters}
                    onFilterChange={setFilters}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSortChange={(field, direction) => {
                      setSortBy(field);
                      setSortDirection(direction);
                    }}
                    users={[]}
                    projects={[]}
                    onCreateIssue={() => setCreateDialogOpen(true)}
                    selectedCount={selectedItems.length}
                    selectedProject="all"
                    onProjectChange={() => {}}
                  />
                  
                  {/* Bulk Actions */}
                  {selectedItems.length > 0 && (
                    <IssuesBulkActions
                      selectedItems={selectedItems}
                      onBulkAction={handleBulkAction}
                      onClearSelection={() => setSelectedItems([])}
                      users={[]}
                      disabled={false}
                      projectId={null}
                    />
                  )}
                  
                  {/* Issues Table */}
                  <IssuesTable
                    issues={Object.values(summary.groups || {}).flat()}
                    users={[]}
                    projects={[]}
                    loading={false}
                    error={null}
                    onEditIssue={openEditDialog}
                    onDeleteIssue={handleDeleteIssue}
                    onViewIssue={openViewDialog}
                    selectedItems={selectedItems}
                    currentUserId={user?.id}
                    onSelectionChange={setSelectedItems}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={(field) => {
                      if (sortBy === field) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(field);
                        setSortDirection('asc');
                      }
                    }}
                    onFilter={setFilters}
                    onSearch={setSearchTerm}
                    searchTerm={searchTerm}
                    filterOptions={filters}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSprintDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelAction}>
        <DialogTitle>
          {confirmDialog.action === 'start' ? 'Start Sprint' : 'Complete Sprint'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.action} the sprint "{confirmDialog.sprintName}"?
          </Typography>
          {confirmDialog.action === 'complete' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Completing a sprint will move all incomplete issues back to the backlog.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={confirmDialog.action === 'start' ? 'success' : 'warning'}
          >
            {confirmDialog.action === 'start' ? 'Start Sprint' : 'Complete Sprint'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={issueForm.title}
              onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={issueForm.type}
                  label="Type"
                  onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                >
                  <MenuItem key="task-sprint" value="task">Task</MenuItem>
                  <MenuItem key="bug-sprint" value="bug">Bug</MenuItem>
                  <MenuItem key="story-sprint" value="story">Story</MenuItem>
                  <MenuItem key="subtask-sprint" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={issueForm.priority}
                  label="Priority"
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                >
                  <MenuItem key="low-sprint" value="low">Low</MenuItem>
                  <MenuItem key="medium-sprint" value="medium">Medium</MenuItem>
                  <MenuItem key="high-sprint" value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Story Points"
              type="number"
              value={issueForm.storyPoints}
              onChange={(e) => setIssueForm({ ...issueForm, storyPoints: e.target.value })}
              sx={{ maxWidth: 120 }}
            />
            
            {/* Custom Fields */}
            <CustomFields 
              issue={useMemo(() => ({ 
                type: issueForm.type, 
                project: sprintDialog.sprint?.project
              }), [issueForm.type, sprintDialog.sprint?.project])}
              onChange={(customFields) => {
                setIssueForm(prev => ({ ...prev, ...customFields }));
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateIssue} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Issue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={issueForm.title}
              onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={issueForm.type}
                  label="Type"
                  onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                >
                  <MenuItem key="task-sprint" value="task">Task</MenuItem>
                  <MenuItem key="bug-sprint" value="bug">Bug</MenuItem>
                  <MenuItem key="story-sprint" value="story">Story</MenuItem>
                  <MenuItem key="subtask-sprint" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={issueForm.priority}
                  label="Priority"
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                >
                  <MenuItem key="low-sprint" value="low">Low</MenuItem>
                  <MenuItem key="medium-sprint" value="medium">Medium</MenuItem>
                  <MenuItem key="high-sprint" value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Story Points"
              type="number"
              value={issueForm.storyPoints}
              onChange={(e) => setIssueForm({ ...issueForm, storyPoints: e.target.value })}
              sx={{ maxWidth: 120 }}
            />
            
            {/* Custom Fields */}
            <CustomFields 
              issue={useMemo(() => ({ 
                type: issueForm.type, 
                project: editingIssue?.project || sprintDialog.sprint?.project,
                ...editingIssue // Include existing issue data for custom fields
              }), [issueForm.type, editingIssue, sprintDialog.sprint?.project])}
              onChange={(customFields) => {
                setIssueForm(prev => ({ ...prev, ...customFields }));
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditIssue} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Issue Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue Details</DialogTitle>
        <DialogContent>
          {viewingIssue && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="h6">{viewingIssue.key} — {viewingIssue.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {viewingIssue.description || 'No description provided'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={viewingIssue.type} variant="outlined" />
                <Chip label={viewingIssue.priority} variant="outlined" />
                <Chip label={viewingIssue.status} variant="outlined" />
                {viewingIssue.storyPoints && <Chip label={`${viewingIssue.storyPoints} pts`} variant="outlined" />}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Sprint Completion Dialog */}
      <Dialog open={sprintCompletionDialog.open} onClose={() => setSprintCompletionDialog({ ...sprintCompletionDialog, open: false })} maxWidth="lg" fullWidth>
        <DialogTitle>
          Complete Sprint: {sprintCompletionDialog.sprint?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Sprint Summary */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Sprint Summary</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {sprintCompletionDialog.completedIssues.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Issues
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {sprintCompletionDialog.incompleteIssues.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Incomplete Issues
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {sprintCompletionDialog.totalIssues}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Issues
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Completed Issues */}
            {sprintCompletionDialog.completedIssues.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom color="success.main">
                  ✅ Completed Issues ({sprintCompletionDialog.completedIssues.length})
                </Typography>
                <List dense>
                  {sprintCompletionDialog.completedIssues.map((issue) => (
                    <ListItem key={issue._id}>
                      <ListItemText
                        primary={`${issue.key} — ${issue.title}`}
                        secondary={`Status: ${issue.status} | Type: ${issue.type}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Incomplete Issues */}
            {sprintCompletionDialog.incompleteIssues.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚠️ Incomplete Issues ({sprintCompletionDialog.incompleteIssues.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  These issues were not completed during this sprint. Choose how to handle them:
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Transfer Incomplete Issues</InputLabel>
                  <Select
                    value={sprintCompletionDialog.transferOption}
                    label="Transfer Incomplete Issues"
                    onChange={(e) => setSprintCompletionDialog({ 
                      ...sprintCompletionDialog, 
                      transferOption: e.target.value,
                      targetSprint: e.target.value === 'specific' ? sprintCompletionDialog.targetSprint : ''
                    })}
                  >
                    <MenuItem key="backlog-move" value="backlog">Move to Backlog</MenuItem>
                    <MenuItem key="next-move" value="next">Move to Next Sprint</MenuItem>
                    {sprintCompletionDialog.availableSprints.length > 0 && (
                      <MenuItem key="specific-move" value="specific">Move to Specific Sprint</MenuItem>
                    )}
                  </Select>
                </FormControl>

          {sprintCompletionDialog.availableSprints.length === 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2" component="div">
                <strong>No other sprints available in this project for transfer.</strong>
                <br />
                This project ({sprintCompletionDialog.sprint?.name?.split(' - ')[0] || 'Current Project'}) only has this one sprint.
                <br />
                <br />
                <strong>Available options:</strong>
                <br />
                • <strong>Move to Backlog:</strong> Issues will be moved to the project backlog
                <br />
                • <strong>Move to Next Sprint:</strong> Will fallback to backlog (no future sprints)
                <br />
                <br />
                <em>To transfer to other sprints, create additional sprints in this project first.</em>
              </Typography>
            </Alert>
          )}

                {sprintCompletionDialog.transferOption === 'specific' && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Sprint</InputLabel>
                    <Select
                      value={sprintCompletionDialog.targetSprint}
                      label="Select Sprint"
                      onChange={(e) => setSprintCompletionDialog({ 
                        ...sprintCompletionDialog, 
                        targetSprint: e.target.value 
                      })}
                    >
                      {sprintCompletionDialog.availableSprints.map((sprint) => (
                        <MenuItem key={sprint._id} value={sprint._id}>
                          {sprint.name} ({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl component="fieldset" margin="normal">
                  <FormLabel component="legend">Issue Status Handling</FormLabel>
                  <RadioGroup
                    value={sprintCompletionDialog.statusHandling}
                    onChange={(e) => setSprintCompletionDialog({ 
                      ...sprintCompletionDialog, 
                      statusHandling: e.target.value 
                    })}
                  >
                    <FormControlLabel 
                      value="keep" 
                      control={<Radio />} 
                      label="Keep current status" 
                    />
                    <FormControlLabel 
                      value="reset" 
                      control={<Radio />} 
                      label="Reset to backlog status" 
                    />
                  </RadioGroup>
                </FormControl>

                <List dense>
                  {sprintCompletionDialog.incompleteIssues.map((issue) => (
                    <ListItem key={issue._id}>
                      <ListItemText
                        primary={`${issue.key} — ${issue.title}`}
                        secondary={`Status: ${issue.status} | Type: ${issue.type}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Sprint Report Preview */}
            <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="h6" gutterBottom>Sprint Report Preview</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Velocity:</strong> {sprintCompletionDialog.completedIssues.length} completed tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Completion Rate:</strong> {sprintCompletionDialog.totalIssues > 0 ? Math.round((sprintCompletionDialog.completedIssues.length / sprintCompletionDialog.totalIssues) * 100) : 0}%
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Estimated Time:</strong> Calculating...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Actual Time:</strong> Calculating...
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSprintCompletionDialog({ ...sprintCompletionDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSprintCompletion}
            disabled={sprintCompletionDialog.transferOption === 'specific' && !sprintCompletionDialog.targetSprint}
          >
            Complete Sprint & Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sprint Report Dialog */}
      <Dialog open={sprintReportDialog.open} onClose={() => setSprintReportDialog({ ...sprintReportDialog, open: false })} maxWidth="lg" fullWidth>
        <DialogTitle>
          Sprint Report: {sprintReportDialog.sprint?.name}
        </DialogTitle>
        <DialogContent>
          {sprintReportDialog.report && (
            <Box id="sprint-report-content" sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Sprint Overview */}
              <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom>Sprint Overview</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Sprint Name</Typography>
                    <Typography variant="body1">{sprintReportDialog.report.sprintName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">
                      {new Date(sprintReportDialog.report.startDate).toLocaleDateString()} - {new Date(sprintReportDialog.report.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Actual End Date</Typography>
                    <Typography variant="body1">
                      {sprintReportDialog.report.actualEndDate ? new Date(sprintReportDialog.report.actualEndDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Report Generated</Typography>
                    <Typography variant="body1">
                      {new Date(sprintReportDialog.report.generatedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Key Metrics */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {sprintReportDialog.report.completedIssues}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Issues
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {sprintReportDialog.report.inProgressIssues}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {sprintReportDialog.report.velocity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Velocity (Story Points)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {Math.round(sprintReportDialog.report.sprintHealth.completionRate)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Issue Type Breakdown */}
              {sprintReportDialog.report.issueTypeBreakdown && sprintReportDialog.report.issueTypeBreakdown.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Issue Type Breakdown</Typography>
                  <List dense>
                    {sprintReportDialog.report.issueTypeBreakdown.map((type, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${type.issueType} (${type.completed}/${type.total} completed)`}
                          secondary={`${type.completedStoryPoints}/${type.storyPoints} story points completed`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Status Breakdown */}
              {sprintReportDialog.report.statusBreakdown && sprintReportDialog.report.statusBreakdown.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
                  <List dense>
                    {sprintReportDialog.report.statusBreakdown.map((status, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${status.status} (${status.count} issues)`}
                          secondary={`${status.storyPoints} story points`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Team Performance */}
              {sprintReportDialog.report.teamMembers && sprintReportDialog.report.teamMembers.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Team Performance</Typography>
                  <List dense>
                    {sprintReportDialog.report.teamMembers.map((member, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${member.member?.name || 'Unknown'} (${member.issuesCompleted}/${member.issuesAssigned} issues completed)`}
                          secondary={`${member.storyPointsCompleted} story points, ${member.hoursSpent}h spent`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Insights */}
              {sprintReportDialog.report.insights && sprintReportDialog.report.insights.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                  <Typography variant="h6" gutterBottom>Key Insights</Typography>
                  <List dense>
                    {sprintReportDialog.report.insights.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={insight.title}
                          secondary={insight.description}
                        />
                        <Chip 
                          label={insight.trend} 
                          color={insight.trend === 'positive' ? 'success' : insight.trend === 'negative' ? 'error' : 'default'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSprintReportDialog({ ...sprintReportDialog, open: false })}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportMenuOpen}
          >
            Export Report
          </Button>
          
          {/* Export Menu */}
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={() => handleExportOption('pdf')}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" />
              </ListItemIcon>
              <MuiListItemText primary="Export as PDF" />
            </MenuItem>
            <MenuItem onClick={() => handleExportOption('excel')}>
              <ListItemIcon>
                <TableChartIcon fontSize="small" />
              </ListItemIcon>
              <MuiListItemText primary="Export as Excel" />
            </MenuItem>
            <MenuItem onClick={() => handleExportOption('csv')}>
              <ListItemIcon>
                <DescriptionIcon fontSize="small" />
              </ListItemIcon>
              <MuiListItemText primary="Export as CSV" />
            </MenuItem>
            <MenuItem onClick={() => handleExportOption('print')}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <MuiListItemText primary="Print Report" />
            </MenuItem>
          </Menu>
        </DialogActions>
      </Dialog>

    </Container>
  );
}



