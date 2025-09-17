import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Folder as ProjectIcon,
  AllInclusive as AllProjectsIcon
} from '@mui/icons-material';
import { useDynamicConfig, useProjectIssueTypes, useProjectPriorities, getStatusOptions, getTypeOptions, getPriorityOptions } from '../hooks/useDynamicConfig';

const SORT_OPTIONS = [
  { value: 'title', label: 'Summary' },
  { value: 'key', label: 'Key' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
  { value: 'assignees', label: 'Assignees' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' }
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'status', label: 'Group by Status' },
  { value: 'assignees', label: 'Group by Assignees' },
  { value: 'type', label: 'Group by Type' },
  { value: 'project', label: 'Group by Project' },
  { value: 'priority', label: 'Group by Priority' }
];

export default function IssuesFilters({
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  sortBy = '',
  sortDirection = 'asc',
  onSortChange,
  groupBy = 'none',
  onGroupChange,
  users = [],
  projects = [],
  onClearFilters,
  onExport,
  onCreateIssue,
  selectedCount = 0,
  selectedProject = 'all',
  onProjectChange
}) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(false);
  const { config, loading: configLoading, error: configError } = useDynamicConfig();
  
  // Get project-specific data
  const { issueTypes, loading: typesLoading, error: typesError } = useProjectIssueTypes(selectedProject !== 'all' ? selectedProject : null);
  const { priorities, loading: prioritiesLoading, error: prioritiesError } = useProjectPriorities(selectedProject !== 'all' ? selectedProject : null);

  // Get dynamic options
  const STATUS_OPTIONS = getStatusOptions(config);
  const TYPE_OPTIONS = getTypeOptions(issueTypes);
  const PRIORITY_OPTIONS = getPriorityOptions(priorities);
  
  // Combined loading state
  const loading = configLoading || typesLoading || prioritiesLoading;
  const error = configError || typesError || prioritiesError;

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange({ ...filters, [filterType]: value });
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.status) count++;
    if (filters.type) count++;
    if (filters.assignees) count++;
    if (filters.project) count++;
    if (filters.priority) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Show loading state while fetching configuration
  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading configuration...
        </Typography>
      </Paper>
    );
  }

  // Show error state if configuration failed to load
  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="error">
          Failed to load configuration: {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Main Search and Quick Actions */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          placeholder="Search issues by title, key, or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        
        <Button
          variant={filtersExpanded ? "contained" : "outlined"}
          startIcon={<FilterIcon />}
          onClick={() => {
            setFiltersExpanded(!filtersExpanded);
            setSortExpanded(false);
            setGroupExpanded(false);
          }}
          size="small"
        >
          FILTERS
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ ml: 1, height: 20, minWidth: 20 }}
            />
          )}
        </Button>

        <Button
          variant={sortExpanded ? "contained" : "outlined"}
          startIcon={<SortIcon />}
          onClick={() => {
            setSortExpanded(!sortExpanded);
            setFiltersExpanded(false);
            setGroupExpanded(false);
          }}
          size="small"
        >
          SORT
        </Button>

        <Button
          variant={groupExpanded ? "contained" : "outlined"}
          startIcon={<GroupIcon />}
          onClick={() => {
            setGroupExpanded(!groupExpanded);
            setFiltersExpanded(false);
            setSortExpanded(false);
          }}
          size="small"
        >
          GROUP
        </Button>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            displayEmpty
            startAdornment={
              selectedProject === 'all' ? 
                <AllProjectsIcon sx={{ mr: 1, color: 'text.secondary' }} /> :
                <ProjectIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }
          >
            <MenuItem key="all-projects" value="all">
              <Stack direction="row" alignItems="center" spacing={1}>
                <AllProjectsIcon fontSize="small" />
                <Typography variant="body2">All Projects</Typography>
              </Stack>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ProjectIcon fontSize="small" />
                  <Typography variant="body2">{project.key} — {project.name}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {activeFiltersCount > 0 && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={onClearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateIssue}
          size="small"
        >
          Create Issue
        </Button>

        {selectedCount > 0 && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onExport}
          >
            Export ({selectedCount})
          </Button>
        )}
      </Stack>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Active filters:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                size="small"
                onDelete={() => onSearchChange('')}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.status && (
              <Chip
                label={`Status: ${STATUS_OPTIONS.find(s => s.value === filters.status)?.label}`}
                size="small"
                onDelete={() => handleFilterChange('status', '')}
                color="secondary"
                variant="outlined"
              />
            )}
            {filters.type && (
              <Chip
                label={`Type: ${TYPE_OPTIONS.find(t => t.value === filters.type)?.label}`}
                size="small"
                onDelete={() => handleFilterChange('type', '')}
                color="info"
                variant="outlined"
              />
            )}
            {filters.assignees && (
              <Chip
                label={`Assignees: ${Array.isArray(filters.assignees) ? filters.assignees.map(id => users.find(u => u._id === id)?.name).join(', ') : users.find(u => u._id === filters.assignees)?.name || 'Unknown'}`}
                size="small"
                onDelete={() => handleFilterChange('assignees', '')}
                color="warning"
                variant="outlined"
              />
            )}
            {filters.project && (
              <Chip
                label={`Project: ${projects.find(p => p._id === filters.project)?.name || 'Unknown'}`}
                size="small"
                onDelete={() => handleFilterChange('project', '')}
                color="success"
                variant="outlined"
              />
            )}
            {filters.priority && (
              <Chip
                label={`Priority: ${PRIORITY_OPTIONS.find(p => p.value === filters.priority)?.label}`}
                size="small"
                onDelete={() => handleFilterChange('priority', '')}
                color="error"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Expanded Filters */}
      {/* Filters Panel */}
      <Collapse in={filtersExpanded}>
        <Grid container spacing={2}>
          {/* Filters */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  <MenuItem key="all-statuses" value="">All Statuses</MenuItem>
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type || ''}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  <MenuItem key="all-types" value="">All Types</MenuItem>
                  {TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Assignees</InputLabel>
                <Select
                  multiple
                  value={Array.isArray(filters.assignees) ? filters.assignees : (filters.assignees ? [filters.assignees] : [])}
                  label="Assignees"
                  onChange={(e) => handleFilterChange('assignees', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((userId) => {
                        const user = users.find(u => u._id === userId);
                        return user ? (
                          <Chip
                            key={userId}
                            size="small"
                            label={user.name}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  <MenuItem key="all-assignees" value="">All Assignees</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{user.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project || ''}
                  label="Project"
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                >
                  <MenuItem key="all-projects-filter" value="">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.key} — {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority || ''}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem key="all-priorities" value="">All Priorities</MenuItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>

        </Grid>
      </Collapse>

      {/* Sort Panel */}
      <Collapse in={sortExpanded}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort Options
            </Typography>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy || ''}
                  label="Sort By"
                  onChange={(e) => handleSortChange(e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {sortBy && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleSortChange(sortBy)}
                  startIcon={sortDirection === 'asc' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Collapse>

      {/* Group Panel */}
      <Collapse in={groupExpanded}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" gutterBottom>
              Group Options
            </Typography>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={groupBy || 'none'}
                  label="Group By"
                  onChange={(e) => onGroupChange(e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  {GROUP_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
}
