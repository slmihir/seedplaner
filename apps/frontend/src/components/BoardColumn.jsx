import { Paper, Typography } from '@mui/material';
import IssueCard from './IssueCard';

export default function BoardColumn({ title, issues = [], onDragStart, onDragOver, onDrop }) {
  return (
    <Paper variant="outlined" sx={{ p: 1, minHeight: 300 }} onDragOver={onDragOver} onDrop={onDrop}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      <div>
        {issues.map((i) => (
          <div key={i._id} draggable onDragStart={(e) => onDragStart(e, i)}>
            <IssueCard issue={i} />
          </div>
        ))}
      </div>
    </Paper>
  );
}


