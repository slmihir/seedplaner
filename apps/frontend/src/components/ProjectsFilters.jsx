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
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  Sort as SortIcon
} from '@mui/icons-material';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'analysis_ready', label: 'Analysis Ready' },
  { value: 'analysis_requirements', label: 'Analysis Requirements' },
  { value: 'development', label: 'Development' },
  { value: 'acceptance', label: 'Acceptance' },
  { value: 'released', label: 'Released' }
];

const TYPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'Story' },
  { value: 'epic', label: 'Epic' }
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'key', label: 'Key' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'storyPoints', label: 'Story Points' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' }
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'status', label: 'Group by Status' },
  { value: 'assignee', label: 'Group by Assignee' },
  { value: 'type', label: 'Group by Type' },
  { value: 'project', label: 'Group by Project' }
];

export default function ProjectsFilters({
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
  onClearFilters,
  onExport,
  selectedCount = 0
}) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(false);

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
    if (filters.assignee) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Main Search and Quick Actions */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          placeholder="Search projects and issues..."
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

        {activeFiltersCount > 0 && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={onClearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}

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
            {filters.assignee && (
              <Chip
                label={`Assignee: ${users.find(u => u._id === filters.assignee)?.name || 'Unknown'}`}
                size="small"
                onDelete={() => handleFilterChange('assignee', '')}
                color="warning"
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
          <Grid item xs={12} md={6}>
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
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={filters.assignee || ''}
                  label="Assignee"
                  onChange={(e) => handleFilterChange('assignee', e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  <MenuItem key="all-assignees" value="">All Assignees</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
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
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Sort Options
            </Typography>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy || ''}
                  label="Sort By"
                  onChange={(e) => onSortChange(e.target.value)}
                  sx={{ minWidth: 200 }}
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
                  onClick={() => onSortChange(sortBy)}
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
          <Grid item xs={12} md={6}>
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
                  sx={{ minWidth: 200 }}
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
