/**
 * Enhanced Board Component with Parent-Child functionality
 * Updated version of Board with better parent-child support
 */

import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  Paper, 
  Box, 
  Button, 
  Stack, 
  Select, 
  MenuItem, 
  Tabs, 
  Tab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Snackbar, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Tooltip, 
  Badge, 
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, DragOverlay, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { useSearchParams } from 'react-router-dom';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  BugReport as BugReportIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  List as ListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Link as LinkIcon,
  List as SubTaskIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../api/client';
import EnhancedIssueCard from '../components/EnhancedIssueCard';
import { EnhancedIssueLinking, SubtaskManager } from '../components/parent-child';
import CustomFields from '../components/CustomFields';
import DailyStatusIndicator from '../components/DailyStatusIndicator';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDynamicConfig } from '../hooks/useDynamicConfig';
import { useAuth } from '../context/AuthContext';

// Helper function to create workflow from system config
const createWorkflowFromTemplate = (template, issueType) => {
  return {
    name: `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} Workflow`,
    statuses: template.statuses.map(s => s.value),
    colors: template.statuses.reduce((acc, status) => {
      acc[status.value] = status.color;
      return acc;
    }, {})
  };
};

// Helper function to build status colors
const buildStatusColors = (statuses) => {
  return statuses.reduce((acc, status) => {
    acc[status.value] = status.color;
    return acc;
  }, {});
};

export default function EnhancedBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [allProjects, setAllProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workflows, setWorkflows] = useState({});
  const [systemConfig, setSystemConfig] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);
  const [boardType, setBoardType] = useState('all');
  const [availableBoardTypes, setAvailableBoardTypes] = useState(['all', 'bug', 'story', 'task', 'subtask']);
  const [linkingDialog, setLinkingDialog] = useState({ open: false, issue: null });
  const [subtaskDialog, setSubtaskDialog] = useState({ open: false, issue: null });
  const [showParentChildOnly, setShowParentChildOnly] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingIssue, setEditingIssue] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, issue: null });

  // Load system configuration
  const { config: dynamicConfig, loading: configLoading } = useDynamicConfig();

  // Load project configuration and build dynamic workflows
  const loadProjectConfig = async (projectId) => {
    try {
      console.log('🔍 Loading project configuration for:', projectId);
      const response = await api.get(`/project-config/${projectId}`);
      const config = response.data.config;
      console.log('✅ Project configuration loaded:', config);
      setProjectConfig(config);
      
      // Build dynamic workflows from project configuration
      const dynamicWorkflows = {};
      const dynamicBoardTypes = ['all'];
      
      if (config.issueTypes && config.issueTypes.length > 0) {
        config.issueTypes.forEach(issueType => {
          dynamicBoardTypes.push(issueType.name);
          dynamicWorkflows[issueType.name] = {
            name: issueType.displayName || issueType.name,
            statuses: issueType.workflow ? issueType.workflow.split(',').map(s => s.trim()) : ['backlog', 'development', 'done'],
            colors: buildStatusColors(config.statuses || [])
          };
        });
      }
      
      console.log('🔄 Dynamic workflows built:', dynamicWorkflows);
      console.log('🔄 Dynamic board types:', dynamicBoardTypes);
      
      setWorkflows(dynamicWorkflows);
      setAvailableBoardTypes(dynamicBoardTypes);
      
      // Ensure 'all' is always available for project-specific views
      if (dynamicBoardTypes.length > 0 && !dynamicBoardTypes.includes('all')) {
        dynamicBoardTypes.unshift('all');
      }
      
      // Create 'all' workflow for project-specific views
      if (dynamicBoardTypes.length > 1) {
        const allStatuses = [...new Set(config.statuses.map(s => s.name))];
        dynamicWorkflows['all'] = {
          name: 'All Issues',
          statuses: allStatuses,
          colors: buildStatusColors(config.statuses)
        };
      }
      
      setWorkflows(dynamicWorkflows);
      setAvailableBoardTypes(dynamicBoardTypes);
      
    } catch (err) {
      console.error('❌ Failed to load project configuration:', err);
      // Fallback to system configuration
      if (systemConfig && systemConfig.workflowTemplates) {
        const fallbackWorkflows = {};
        const fallbackBoardTypes = ['all', 'bug', 'story', 'task', 'subtask'];
        
        systemConfig.workflowTemplates.forEach(template => {
          template.issueTypes.forEach(issueType => {
            fallbackWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
          });
        });
        
        console.log('🔄 Falling back to system workflow templates:', fallbackWorkflows);
        setWorkflows(fallbackWorkflows);
        setAvailableBoardTypes(fallbackBoardTypes.length > 0 ? fallbackBoardTypes : ['bug', 'story', 'task', 'subtask']);
      }
    }
  };

  const loadBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const projects = await api.get('/projects');
      const list = projects.data.projects;
      setAllProjects(list);
      let proj = null;
      const projectParam = searchParams.get('project');
      if (projectParam) {
        proj = list.find(p => p._id === projectParam);
        if (proj) {
          setProject(proj);
          await loadProjectConfig(proj._id);
        } else {
          setError('Project not found');
          return;
        }
      } else {
        // If no project selected, use system configuration
        if (systemConfig && systemConfig.workflowTemplates) {
          const fallbackWorkflows = {};
          const fallbackBoardTypes = ['all', 'bug', 'story', 'task', 'subtask'];
          
          if (systemConfig && systemConfig.workflowTemplates) {
            systemConfig.workflowTemplates.forEach(template => {
              template.issueTypes.forEach(issueType => {
                fallbackWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
              });
            });
          }
          
          console.log('🔄 Using system workflow templates:', fallbackWorkflows);
          setWorkflows(fallbackWorkflows);
          setAvailableBoardTypes(fallbackBoardTypes.length > 0 ? fallbackBoardTypes : ['bug', 'story', 'task', 'subtask']);
        }
      }
      
      // Get all issues for the project (or all issues if no specific project)
      let issuesResponse;
      if (proj && proj._id) {
        issuesResponse = await api.get(`/issues?project=${proj._id}`);
      } else {
        // If no project selected, get all issues from all projects
        issuesResponse = await api.get('/issues');
      }
      const allIssues = issuesResponse.data.issues;
      
      // Normalize status names for consistent matching
      const normalizeStatus = (status) => status.toLowerCase().replace(/[\s-]/g, '_');
      
      // Filter issues by board type
      const filteredIssues = allIssues.filter(issue => {
        if (boardType === 'all') {
          return true; // Show all issues
        }
        if (boardType === 'subtask') {
          return issue.type === 'subtask' || issue.parentIssue; // Include subtasks and issues with parent
        }
        return issue.type === boardType;
      });

      // Additional filtering for parent-child relationships
      const finalFilteredIssues = showParentChildOnly 
        ? filteredIssues.filter(issue => 
            issue.parentIssue || 
            (issue.childIssues && issue.childIssues.length > 0) ||
            (issue.linkedIssues && issue.linkedIssues.length > 0)
          )
        : filteredIssues;
      
      // Group filtered issues by status using dynamic workflow
      const groupedColumns = {};
      let currentWorkflow = workflows[boardType];

      // For 'all' board type, create a workflow from all available statuses
      if (boardType === 'all') {
        const allStatuses = [...new Set(allIssues.map(issue => normalizeStatus(issue.status)))];
        currentWorkflow = {
          name: 'All Issues',
          statuses: allStatuses
        };
      }

      // Ensure all statuses from the current workflow are present as keys
      if (currentWorkflow && currentWorkflow.statuses) {
        currentWorkflow.statuses.forEach(status => {
          groupedColumns[status] = finalFilteredIssues.filter(issue => normalizeStatus(issue.status) === normalizeStatus(status));
        });
      } else {
        // Fallback: use all available statuses from issues
        const allStatuses = [...new Set(allIssues.map(issue => normalizeStatus(issue.status)))];
        allStatuses.forEach(status => {
          groupedColumns[status] = finalFilteredIssues.filter(issue => normalizeStatus(issue.status) === normalizeStatus(status));
        });
      }

      // Ensure all columns from grouped data are rendered, even if not in workflow
      const allColumnKeys = [...new Set([...(currentWorkflow?.statuses || []), ...Object.keys(groupedColumns)])];
      const finalColumns = {};
      allColumnKeys.forEach(status => {
        finalColumns[status] = groupedColumns[status] || [];
      });

      setColumns(finalColumns);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  // Initialize workflows when system config is loaded
  useEffect(() => {
    if (systemConfig && systemConfig.workflowTemplates && Object.keys(workflows).length === 0) {
      const initialWorkflows = {};
      systemConfig.workflowTemplates.forEach(template => {
        template.issueTypes.forEach(issueType => {
          initialWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
        });
      });
      setWorkflows(initialWorkflows);
    }
  }, [systemConfig]);

  useEffect(() => {
    loadBoard();
    const interval = setInterval(() => {
      loadBoard();
    }, 15000);
    return () => clearInterval(interval);
  }, [searchParams, boardType, showParentChildOnly]);

  // Listen for custom events from other components (like Sprint dialog)
  useEffect(() => {
    const handleIssuesDataChanged = (event) => {
      const { action, projectId } = event.detail;
      console.log(`🔄 Board data changed: ${action} in project ${projectId}`);
      
      // Only refresh if we're viewing the specific project or all projects
      if (!project || project._id === projectId) {
        console.log('🔄 Refreshing Board page due to external data change');
        loadBoard();
      }
    };

    window.addEventListener('issuesDataChanged', handleIssuesDataChanged);
    
    return () => {
      window.removeEventListener('issuesDataChanged', handleIssuesDataChanged);
    };
  }, [project]);

  const onDragStart = (event) => {
    // Handle drag start if needed
  };

  const onDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const issueId = active.id;
    const newStatus = over.id;
    
    try {
      await api.patch(`/issues/${issueId}`, { status: newStatus });
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', {
        detail: {
          action: 'update',
          projectId: project?._id,
          issueId: issueId
        } 
      }));
      
      // Background refresh
      loadBoard();
    } catch (_) {}
  };

  const columnTitle = (s) => s.replace('_', ' ');
  const getHeaderBg = (status) => {
    const workflow = workflows[boardType];
    return workflow?.colors?.[status] || '#f5f5f5';
  };

  const handleLinkClick = (issue) => {
    setLinkingDialog({ open: true, issue });
  };

  const handleSubtaskClick = (issue) => {
    setSubtaskDialog({ open: true, issue });
  };

  const handleLinkUpdate = () => {
    loadBoard(); // Refresh the board to show updated linking information
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Kanban Board
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          {project && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={project._id}
                onChange={(e) => {
                  setSearchParams({ project: e.target.value });
                  setProject(allProjects.find(p => p._id === e.target.value));
                }}
                label="Project"
              >
                {allProjects.map((p) => (
                  <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button size="small" onClick={loadBoard}>Refresh</Button>
        </Stack>

        {/* Board Type Selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Board Type</InputLabel>
            <Select
              value={boardType}
              onChange={(e) => setBoardType(e.target.value)}
              label="Board Type"
            >
              {availableBoardTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === 'all' ? 'All Issues' : 
                   type === 'bug' ? 'Bugs' :
                   type === 'story' ? 'Stories' :
                   type === 'task' ? 'Tasks' :
                   type === 'subtask' ? 'Subtasks' :
                   type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Parent-Child Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showParentChildOnly}
                onChange={(e) => setShowParentChildOnly(e.target.checked)}
              />
            }
            label="Show only issues with relationships"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showHierarchy}
                onChange={(e) => setShowHierarchy(e.target.checked)}
              />
            }
            label="Show hierarchy in cards"
          />
        </Box>
      </Box>

      {/* Board */}
      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor),
          useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
          })
        )}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Grid container spacing={2}>
          {Object.entries(columns).map(([status, issues]) => (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={status}>
              <Paper sx={{ p: 2, minHeight: 400 }}>
                <Box sx={{ 
                  p: 1, 
                  mb: 2, 
                  borderRadius: 1, 
                  bgcolor: getHeaderBg(status),
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    {columnTitle(status)} ({issues.length})
                  </Typography>
                </Box>
                
                <DroppableColumn id={status}>
                  <Stack spacing={1}>
                    {issues.map((issue) => (
                      <DraggableIssue key={issue._id} issue={issue}>
                        <EnhancedIssueCard
                          issue={issue}
                          showEditButton={true}
                          showDeleteButton={true}
                          showLinkButton={true}
                          showHierarchy={showHierarchy}
                          onEditClick={(issue) => setEditingIssue(issue)}
                          onDeleteClick={(issue) => setConfirmDialog({ open: true, issue })}
                          onLinkClick={handleLinkClick}
                          onIssueClick={(issue) => {
                            // Handle issue click - could open details modal
                            console.log('Issue clicked:', issue);
                          }}
                          currentUserId={user?._id}
                          users={[]} // You might want to load users
                          projects={allProjects}
                        />
                      </DraggableIssue>
                    ))}
                  </Stack>
                </DroppableColumn>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DndContext>

      {/* Enhanced Issue Linking Dialog */}
      <EnhancedIssueLinking
        open={linkingDialog.open}
        onClose={() => setLinkingDialog({ open: false, issue: null })}
        issue={linkingDialog.issue}
        onLinkUpdate={handleLinkUpdate}
      />

      {/* Subtask Manager Dialog */}
      <SubtaskManager
        open={subtaskDialog.open}
        onClose={() => setSubtaskDialog({ open: false, issue: null })}
        parentIssue={subtaskDialog.issue}
        onSubtaskUpdate={handleLinkUpdate}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
}

// Droppable Column Component
function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 300,
        p: 1,
        borderRadius: 1,
        bgcolor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
        border: isOver ? '2px dashed' : '2px solid transparent',
        borderColor: isOver ? 'primary.main' : 'transparent'
      }}
    >
      {children}
    </Box>
  );
}

// Draggable Issue Component
function DraggableIssue({ id, issue, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: issue._id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
