import { Card, CardContent, Typography, Chip, Stack, Avatar, Tooltip, IconButton, Box } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import SubtaskIcon from '@mui/icons-material/List';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomFields from './CustomFields';
import DailyStatusIndicator from './DailyStatusIndicator';

const typeColor = {
  task: 'default',
  bug: 'error',
  story: 'primary',
  epic: 'secondary',
  subtask: 'info'
};

const priorityColor = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error'
};

export default function IssueCard({ issue, onLinkClick, onEditClick, onDeleteClick, showLinkButton = true, showEditButton = true, showDeleteButton = true, currentUserId }) {
  return (
    <Card variant="outlined" sx={{ mb: 1, boxShadow: 1 }} data-issue-id={issue._id} aria-label={`Issue ${issue.key}`}>
      <CardContent sx={{ p: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {issue.key} — {issue.title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {issue.parentIssue && (
              <Tooltip title={`Parent: ${issue.parentIssue.key || 'Unknown'}`}>
                <SubtaskIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              </Tooltip>
            )}
            {showLinkButton && onLinkClick && (
              <Tooltip title="Link Issues">
                <IconButton size="small" onClick={() => onLinkClick(issue)}>
                  <LinkIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {showEditButton && onEditClick && (
              <Tooltip title="Edit Issue">
                <IconButton size="small" onClick={() => onEditClick(issue)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {showDeleteButton && onDeleteClick && (
              <Tooltip title="Delete Issue">
                <IconButton size="small" onClick={() => onDeleteClick(issue)}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {currentUserId && (
              <DailyStatusIndicator 
                issueId={issue._id} 
                userId={currentUserId} 
                issue={issue}
              />
            )}
            <Tooltip title={issue.assignee?.name || 'Unassigned'}>
              <Avatar sx={{ width: 24, height: 24 }}>
                {(issue.assignee?.name || '?').charAt(0)}
              </Avatar>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip size="small" label={issue.type} color={typeColor[issue.type] || 'default'} variant="outlined" aria-label={`type ${issue.type}`} />
          <Chip size="small" label={issue.priority} color={priorityColor[issue.priority] || 'default'} variant="outlined" aria-label={`priority ${issue.priority}`} />
          {issue.storyPoints > 0 && (
            <Chip 
              size="small" 
              label={`${issue.storyPoints} pts`} 
              color="primary" 
              variant="outlined" 
              aria-label={`${issue.storyPoints} story points`}
              sx={{ fontWeight: 'bold' }}
            />
          )}
          {issue.status && <Chip size="small" label={issue.status.replace('_',' ')} variant="outlined" aria-label={`status ${issue.status}`} />}
        </Stack>
        
               {/* Show custom fields */}
               <CustomFields issue={issue} compact={true} showLabels={false} />
               
               {/* Show linking information */}
               {(issue.childIssues?.length > 0 || issue.linkedIssues?.length > 0) && (
                 <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                   <Typography variant="caption" color="text.secondary">
                     {issue.childIssues?.length > 0 && `${issue.childIssues.length} subtasks`}
                     {issue.childIssues?.length > 0 && issue.linkedIssues?.length > 0 && ' • '}
                     {issue.linkedIssues?.length > 0 && `${issue.linkedIssues.length} links`}
                   </Typography>
                 </Box>
               )}
      </CardContent>
    </Card>
  );
}


