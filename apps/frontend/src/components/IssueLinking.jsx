import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import UnlinkIcon from '@mui/icons-material/LinkOff';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

const IssueLinking = ({ open, onClose, issue, onLinkUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkType, setLinkType] = useState('relates_to');
  const [parentChild, setParentChild] = useState('');
  const [hierarchy, setHierarchy] = useState(null);
  const [error, setError] = useState(null);
  
  // Debounce search term for better UX
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const linkTypes = [
    { value: 'relates_to', label: 'Relates to' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'is_blocked_by', label: 'Is blocked by' },
    { value: 'duplicates', label: 'Duplicates' },
    { value: 'is_duplicated_by', label: 'Is duplicated by' }
  ];

  useEffect(() => {
    if (open && issue) {
      loadHierarchy();
    }
  }, [open, issue]);

  // Auto-search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim() && open && issue) {
      console.log('useEffect triggered - searching for:', debouncedSearchTerm);
      searchIssues();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, open, issue]);

  const loadHierarchy = async () => {
    try {
      const response = await api.get(`/issues/${issue._id}/hierarchy`);
      setHierarchy(response.data.hierarchy);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      // Don't show hierarchy error as a blocking error, just log it
      setHierarchy({
        parent: null,
        children: [],
        linked: []
      });
    }
  };

  const searchIssues = async () => {
    if (!debouncedSearchTerm.trim()) return;
    
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Handle both string and object project IDs
      const projectId = typeof issue.project === 'string' ? issue.project : issue.project._id;
      console.log('Searching for:', debouncedSearchTerm, 'in project:', projectId);
      console.log('Issue object:', issue);
      console.log('Auth token:', localStorage.getItem('token'));
      
      const response = await api.get(`/issues?q=${debouncedSearchTerm}&project=${projectId}`);
      console.log('Search response:', response.data);
      setSearchResults(response.data.issues.filter(i => i._id !== issue._id));
    } catch (err) {
      console.error('Search error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      setError(`Failed to search issues: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const linkIssue = async (targetIssueId) => {
    try {
      await api.post('/issues/link', {
        issueId: issue._id,
        targetIssueId,
        linkType,
        parentChild
      });
      await loadHierarchy();
      onLinkUpdate?.();
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link issues');
    }
  };

  const unlinkIssue = async (targetIssueId) => {
    try {
      await api.post('/issues/unlink', {
        issueId: issue._id,
        targetIssueId
      });
      await loadHierarchy();
      onLinkUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlink issues');
    }
  };

  const createSubtask = async () => {
    try {
      const title = prompt('Enter subtask title:');
      if (!title) return;
      
      const description = prompt('Enter subtask description (optional):');
      const estimate = prompt('Enter estimate in hours (optional):');
      
      await api.post('/issues/subtask', {
        title,
        description,
        parentIssueId: issue._id,
        estimate: estimate ? parseInt(estimate) : undefined
      });
      
      await loadHierarchy();
      onLinkUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subtask');
    }
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Link Issues - {issue.key}: {issue.title}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Search and Link Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Link to Another Issue</Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Search issues"
                placeholder="Type to search issues by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchIssues()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              <Button
                variant="outlined"
                onClick={searchIssues}
                disabled={loading || !searchTerm.trim()}
                sx={{ minWidth: 'auto', px: 2 }}
                title="Search issues"
              >
                <SearchIcon />
              </Button>
            </Box>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Searching...
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Link Type</InputLabel>
              <Select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                label="Link Type"
              >
                {linkTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Relationship</InputLabel>
              <Select
                value={parentChild}
                onChange={(e) => setParentChild(e.target.value)}
                label="Relationship"
              >
                <MenuItem key="general-link" value="">General Link</MenuItem>
                <MenuItem key="parent-link" value="parent">Make Parent</MenuItem>
                <MenuItem key="child-link" value="child">Make Child</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {searchResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {searchResults.map((searchIssue) => (
                  <ListItem key={searchIssue._id} divider>
                    <ListItemText
                      primary={`${searchIssue.key} - ${searchIssue.title}`}
                      secondary={`${searchIssue.type} • ${searchIssue.status}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => linkIssue(searchIssue._id)}
                        color="primary"
                        title="Link this issue"
                      >
                        <LinkIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {searchTerm.trim() && !loading && searchResults.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No issues found matching "{searchTerm}"
            </Typography>
          )}
        </Box>
        
        {/* Current Hierarchy */}
        {hierarchy && (
          <Box>
            <Typography variant="h6" gutterBottom>Current Links</Typography>
            
            {/* Parent Issue */}
            {hierarchy.parent && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Parent Issue</Typography>
                <Chip
                  label={`${hierarchy.parent.key} - ${hierarchy.parent.title}`}
                  color="primary"
                  onDelete={() => unlinkIssue(hierarchy.parent._id)}
                />
              </Box>
            )}
            
            {/* Child Issues */}
            {hierarchy.children && hierarchy.children.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Child Issues</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hierarchy.children.map((child) => (
                    <Chip
                      key={child._id}
                      label={`${child.key} - ${child.title}`}
                      color="secondary"
                      onDelete={() => unlinkIssue(child._id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Linked Issues */}
            {hierarchy.linked && hierarchy.linked.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Linked Issues</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hierarchy.linked.map((link) => (
                    <Chip
                      key={link.issue._id}
                      label={`${link.issue.key} - ${link.issue.title} (${link.linkType})`}
                      color="default"
                      onDelete={() => unlinkIssue(link.issue._id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Create Subtask Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={createSubtask}
                color="primary"
              >
                Create Subtask
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IssueLinking;
