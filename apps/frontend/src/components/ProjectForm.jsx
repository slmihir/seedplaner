import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput } from '@mui/material';

export default function ProjectForm({ open, onClose, onSubmit, initial = null, users = [] }) {
  const [form, setForm] = useState({ key: '', name: '', description: '', members: [], status: 'active' });

  useEffect(() => {
    if (initial) {
      setForm({
        key: initial.key || '',
        name: initial.name || '',
        description: initial.description || '',
        members: (initial.members || []).map((m) => (typeof m === 'string' ? m : m._id)),
        status: initial.status || 'active'
      });
    } else {
      setForm({ key: '', name: '', description: '', members: [], status: 'active' });
    }
  }, [initial, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit Project' : 'Create Project'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }} onSubmit={handleSubmit}>
          <TextField label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required disabled={!!initial} />
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.status}
              label="Status"
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem key="active" value="active">Active</MenuItem>
              <MenuItem key="on_hold" value="on_hold">On Hold</MenuItem>
              <MenuItem key="completed" value="completed">Completed</MenuItem>
              <MenuItem key="cancelled" value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="members-label">Members</InputLabel>
            <Select
              labelId="members-label"
              multiple
              input={<OutlinedInput label="Members" />}
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const u = users.find((x) => x._id === id);
                    return <Chip key={id} label={u ? u.name : id} />;
                  })}
                </Box>
              )}
            >
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>{u.name} — {u.email}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>{initial ? 'Save' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}


