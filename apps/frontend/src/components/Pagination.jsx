import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100]
}) {
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  const handlePageChange = (event, newPage) => {
    onPageChange(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    onItemsPerPageChange(parseInt(event.target.value));
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      p: 2,
      borderTop: 1,
      borderColor: 'divider'
    }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {totalItems} issues
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Per page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Per page"
            onChange={handleItemsPerPageChange}
          >
            {itemsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handlePageChange}
        color="primary"
        showFirstButton
        showLastButton
        siblingCount={2}
        boundaryCount={1}
      />
    </Box>
  );
}
