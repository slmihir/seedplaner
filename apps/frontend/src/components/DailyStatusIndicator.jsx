import React from "react";
import { Box, Tooltip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import CheckIcon from "@mui/icons-material/Check";
import api from "../api/client";

export default function DailyStatusIndicator({ issueId, userId, issue, size = "small" }) {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);

	// Prefer explicit issue prop; otherwise rely on minimal fetch data passed into parent components
	const updatedAt = issue?.updatedAt;
	const createdAt = issue?.createdAt;
	const currentDaily = issue?.dailyStatus;

	const now = new Date();
	const updated = updatedAt ? new Date(updatedAt) : (createdAt ? new Date(createdAt) : null);

	let color = currentDaily === 'green' ? '#2e7d32' : currentDaily === 'yellow' ? '#f9a825' : '#ffffff';
	let label = currentDaily ? `Status: ${currentDaily}` : "No recent activity";
	if (updated) {
		const isSameDay = updated.toDateString() === now.toDateString();
		const msDiff = now.getTime() - updated.getTime();
		const daysDiff = msDiff / (1000 * 60 * 60 * 24);
		if (!currentDaily) {
			if (isSameDay) {
				color = "#2e7d32"; // green
				label = "Updated today";
			} else if (daysDiff <= 3) {
				color = "#f9a825"; // yellow
				label = `Updated ${Math.max(1, Math.floor(daysDiff))} day(s) ago`;
			} else {
				color = "#ffffff"; // white
				label = `Updated ${Math.floor(daysDiff)} day(s) ago`;
			}
		}
	}

	const dotSize = size === "small" ? 10 : size === "medium" ? 12 : 14;
	const borderColor = "rgba(0,0,0,0.2)";

	const handleOpen = (e) => {
		e.stopPropagation();
		setAnchorEl(e.currentTarget);
	};

	const handleClose = () => setAnchorEl(null);

	const setDaily = async (value) => {
		try {
			handleClose();
			// Optimistic update if issue object present
			if (issue) {
				issue.dailyStatus = value;
			}
			await api.patch(`/issues/${issueId}`, { dailyStatus: value });
			// Broadcast to refresh other views
			window.dispatchEvent(new CustomEvent('issuesDataChanged', { detail: { action: 'update', projectId: issue?.project, issueId } }));
		} catch (_) {}
	};

	return (
		<>
			<Tooltip title={label + ' — click to change'} arrow>
				<IconButton size="small" onClick={handleOpen} onMouseDown={(e) => e.stopPropagation()} aria-label="edit daily status">
					<Box
						component="span"
						sx={{
							display: "inline-block",
							width: dotSize,
							height: dotSize,
							borderRadius: "50%",
							backgroundColor: color,
							border: `1px solid ${borderColor}`,
						}}
					/>
				</IconButton>
			</Tooltip>
			<Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
				<MenuItem onClick={(e) => { e.stopPropagation(); setDaily('green'); }}>
					<ListItemIcon>
						<CircleIcon fontSize="small" sx={{ color: '#2e7d32' }} />
					</ListItemIcon>
					<ListItemText>Green</ListItemText>
					{currentDaily === 'green' && <CheckIcon fontSize="small" />}
				</MenuItem>
				<MenuItem onClick={(e) => { e.stopPropagation(); setDaily('yellow'); }}>
					<ListItemIcon>
						<CircleIcon fontSize="small" sx={{ color: '#f9a825' }} />
					</ListItemIcon>
					<ListItemText>Yellow</ListItemText>
					{currentDaily === 'yellow' && <CheckIcon fontSize="small" />}
				</MenuItem>
				<MenuItem onClick={(e) => { e.stopPropagation(); setDaily('white'); }}>
					<ListItemIcon>
						<CircleIcon fontSize="small" sx={{ color: '#ffffff' }} />
					</ListItemIcon>
					<ListItemText>White</ListItemText>
					{currentDaily === 'white' && <CheckIcon fontSize="small" />}
				</MenuItem>
			</Menu>
		</>
	);
}


