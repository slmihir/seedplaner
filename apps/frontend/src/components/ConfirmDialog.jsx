import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}


