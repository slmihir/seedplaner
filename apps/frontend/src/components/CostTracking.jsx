import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Warning,
  Error,
  CheckCircle,
  Upload,
  Add,
  Edit,
  Delete,
  Visibility,
  Assessment,
  AccountBalance,
  CloudUpload
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api/client';

const CostTracking = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [costs, setCosts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  
  // Dialog states
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  
  // Form states
  const [costForm, setCostForm] = useState({
    description: '',
    amount: '',
    currency: 'USD',
    category: '',
    subcategory: '',
    source: '',
    startDate: '',
    endDate: '',
    project: '',
    notes: ''
  });
  
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    currency: 'USD',
    period: 'monthly',
    project: ''
  });
  
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Cost Categories Management
  const [costCategories, setCostCategories] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState({
    open: false,
    category: null,
    isEdit: false
  });
  const [newCategory, setNewCategory] = useState({
    value: '',
    label: '',
    description: '',
    color: 'default',
    isActive: true
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  useEffect(() => {
    loadProjectId();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadProjectId = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data.projects && response.data.projects.length > 0) {
        setProjectId(response.data.projects[0]._id);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project data');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCosts(),
        loadBudgets(),
        loadAnalytics(),
        loadAlerts(),
        loadCostCategories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load cost tracking data');
    } finally {
      setLoading(false);
    }
  };

  const loadCosts = async () => {
    try {
      const response = await api.get(`/costs/project/${projectId}`);
      setCosts(response.data.costs || []);
    } catch (error) {
      console.error('Error loading costs:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const response = await api.get(`/budgets/project/${projectId}`);
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/costs/analytics/${projectId}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.get(`/budgets/alerts/${projectId}`);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadCostCategories = async () => {
    try {
      const response = await api.get('/system-config/cost-categories');
      setCostCategories(response.data.costCategories || []);
    } catch (error) {
      console.error('Error loading cost categories:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCostSubmit = async () => {
    try {
      setError(null); // Clear any previous errors
      
      // Validate required fields
      if (!costForm.description.trim()) {
        setError('Description is required');
        return;
      }
      if (!costForm.amount || isNaN(parseFloat(costForm.amount))) {
        setError('Valid amount is required');
        return;
      }
      if (!costForm.category) {
        setError('Category is required');
        return;
      }
      if (!costForm.source.trim()) {
        setError('Source is required');
        return;
      }
      if (!costForm.startDate) {
        setError('Start date is required');
        return;
      }
      if (!costForm.endDate) {
        setError('End date is required');
        return;
      }
      if (!projectId) {
        setError('Project is required');
        return;
      }
      
      const costData = {
        ...costForm,
        project: projectId,
        amount: parseFloat(costForm.amount)
      };

      if (selectedCost) {
        await api.patch(`/costs/${selectedCost._id}`, costData);
      } else {
        await api.post('/costs', costData);
      }

      setCostDialogOpen(false);
      resetCostForm();
      loadCosts();
      loadAnalytics();
    } catch (error) {
      console.error('Error saving cost:', error);
      setError(error.response?.data?.message || 'Failed to save cost entry. Please try again.');
    }
  };

  const handleBudgetSubmit = async () => {
    try {
      const budgetData = {
        ...budgetForm,
        project: projectId,
        totalBudget: parseFloat(budgetForm.totalBudget)
      };

      if (selectedBudget) {
        await api.patch(`/budgets/${selectedBudget._id}`, budgetData);
      } else {
        await api.post('/budgets', budgetData);
      }

      setBudgetDialogOpen(false);
      resetBudgetForm();
      loadBudgets();
      loadAlerts();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await api.post(`/costs/import/${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setImportDialogOpen(false);
      setUploadFile(null);
      setUploadProgress(0);
      loadCosts();
      loadAnalytics();
      
      console.log('Import successful:', response.data);
    } catch (error) {
      console.error('Error importing file:', error);
    }
  };

  const resetCostForm = () => {
    setCostForm({
      description: '',
      amount: '',
      currency: 'USD',
      category: '',
      subcategory: '',
      source: '',
      startDate: '',
      endDate: '',
      project: '',
      notes: ''
    });
    setSelectedCost(null);
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      totalBudget: '',
      currency: 'USD',
      period: 'monthly',
      project: ''
    });
    setSelectedBudget(null);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <Error />;
      case 'warning': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  // Cost Categories Management Functions
  const openCategoryDialog = (category = null, isEdit = false) => {
    setCategoryDialog({
      open: true,
      category: category ? { ...category } : { ...newCategory },
      isEdit
    });
  };

  const closeCategoryDialog = () => {
    setCategoryDialog({
      open: false,
      category: null,
      isEdit: false
    });
  };

  const addCostCategory = async () => {
    try {
      const response = await api.post('/system-config/cost-categories', categoryDialog.category);
      setCostCategories(response.data.costCategories);
      closeCategoryDialog();
      setError(null);
      // Show success message
      console.log('Cost category added successfully');
    } catch (err) {
      setError('Failed to add cost category');
      console.error('Error adding cost category:', err);
    }
  };

  const updateCostCategory = async () => {
    try {
      const response = await api.put(`/system-config/cost-categories/${categoryDialog.category.value}`, categoryDialog.category);
      setCostCategories(response.data.costCategories);
      closeCategoryDialog();
      setError(null);
      // Show success message
      console.log('Cost category updated successfully');
    } catch (err) {
      setError('Failed to update cost category');
      console.error('Error updating cost category:', err);
    }
  };

  const deleteCostCategory = async (categoryValue) => {
    try {
      const response = await api.delete(`/system-config/cost-categories/${categoryValue}`);
      setCostCategories(response.data.costCategories);
      setError(null);
      // Show success message
      console.log('Cost category deleted successfully');
    } catch (err) {
      setError('Failed to delete cost category');
      console.error('Error deleting cost category:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading cost tracking data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cost Tracking & Budget Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Import Costs
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setCostDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Add Cost
          </Button>
          <Button
            variant="contained"
            startIcon={<AccountBalance />}
            onClick={() => setBudgetDialogOpen(true)}
          >
            Create Budget
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={getAlertColor(alert.type)} 
              icon={getAlertIcon(alert.type)}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">{alert.message}</Typography>
              <Typography variant="body2">
                Remaining Budget: {formatCurrency(alert.remainingBudget)}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Costs" />
          <Tab label="Budgets" />
          <Tab label="Analytics" />
          <Tab label="Categories" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">
                      {formatCurrency(costs.reduce((sum, cost) => sum + cost.amount, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Spending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">
                      {formatCurrency(budgets.reduce((sum, budget) => sum + budget.totalBudget, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{costs.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost Entries
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{alerts.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Alerts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Costs */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Costs
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costs.slice(0, 5).map((cost) => (
                        <TableRow key={cost._id}>
                          <TableCell>{cost.description}</TableCell>
                          <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                          <TableCell>
                            <Chip label={cost.category} size="small" />
                          </TableCell>
                          <TableCell>{formatDate(cost.startDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Budget Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget Status
                </Typography>
                {budgets.slice(0, 3).map((budget) => (
                  <Box key={budget._id} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{budget.name}</Typography>
                      <Chip 
                        label={budget.status} 
                        color={budget.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="body2">
                        {formatCurrency(budget.totalBudget, budget.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Costs Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Costs
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costs.map((cost) => (
                        <TableRow key={cost._id}>
                          <TableCell>{cost.description}</TableCell>
                          <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                          <TableCell>
                            <Chip label={cost.category} size="small" />
                          </TableCell>
                          <TableCell>{cost.source}</TableCell>
                          <TableCell>
                            {formatDate(cost.startDate)} - {formatDate(cost.endDate)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={cost.status} 
                              color={cost.status === 'approved' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedCost(cost);
                                  setCostForm({
                                    description: cost.description,
                                    amount: cost.amount.toString(),
                                    currency: cost.currency,
                                    category: cost.category,
                                    subcategory: cost.subcategory || '',
                                    source: cost.source,
                                    startDate: cost.startDate.split('T')[0],
                                    endDate: cost.endDate.split('T')[0],
                                    notes: cost.notes || ''
                                  });
                                  setCostDialogOpen(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this cost?')) {
                                    await api.delete(`/costs/${cost._id}`);
                                    loadCosts();
                                    loadAnalytics();
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Budgets Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Budgets
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Budget</TableCell>
                        <TableCell align="right">Spent</TableCell>
                        <TableCell align="right">Remaining</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgets.map((budget) => (
                        <TableRow key={budget._id}>
                          <TableCell>{budget.name}</TableCell>
                          <TableCell align="right">{formatCurrency(budget.totalBudget, budget.currency)}</TableCell>
                          <TableCell align="right">{formatCurrency(budget.actualSpending || 0, budget.currency)}</TableCell>
                          <TableCell align="right">{formatCurrency(budget.remainingBudget || budget.totalBudget, budget.currency)}</TableCell>
                          <TableCell>
                            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={budget.status} 
                              color={budget.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedBudget(budget);
                                  setBudgetForm({
                                    name: budget.name,
                                    description: budget.description || '',
                                    startDate: budget.startDate.split('T')[0],
                                    endDate: budget.endDate.split('T')[0],
                                    totalBudget: budget.totalBudget.toString(),
                                    currency: budget.currency,
                                    period: budget.period
                                  });
                                  setBudgetDialogOpen(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedBudget(budget);
                                  setBudgetForm({
                                    name: budget.name,
                                    description: budget.description || '',
                                    startDate: budget.startDate.split('T')[0],
                                    endDate: budget.endDate.split('T')[0],
                                    totalBudget: budget.totalBudget.toString(),
                                    currency: budget.currency,
                                    period: budget.period
                                  });
                                  setBudgetDialogOpen(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this budget?')) {
                                    await api.delete(`/budgets/${budget._id}`);
                                    loadBudgets();
                                    loadAlerts();
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {activeTab === 3 && analytics && (
        <Grid container spacing={3}>
          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending by Category
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalAmount"
                      >
                        {analytics.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Trend */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Spending Trend
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id.month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="totalAmount" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Spending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Budget vs Actual */}
          {analytics.budgetComparison && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Budget vs Actual Spending
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        {
                          name: 'Budgeted',
                          amount: analytics.budgetComparison.budgeted
                        },
                        {
                          name: 'Actual',
                          amount: analytics.budgetComparison.actual
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box mt={2}>
                    <Typography variant="body2">
                      Variance: {formatCurrency(analytics.budgetComparison.variance)} 
                      ({analytics.budgetComparison.variancePercentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Categories Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Cost Categories ({costCategories.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => openCategoryDialog(newCategory, false)}
                  >
                    Add Category
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manage cost categories that can be used when creating cost entries.
                </Typography>
                
                <Grid container spacing={2}>
                  {costCategories.map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Box 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                bgcolor: category.color || '#ECEFF1',
                                mr: 1 
                              }} 
                            />
                            <Typography variant="h6">
                              {category.label}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {category.description}
                          </Typography>
                          <Chip label={category.value} size="small" sx={{ mb: 1 }} />
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color={category.isActive ? 'success.main' : 'text.disabled'}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                            <Box>
                              <Tooltip title="Edit Category">
                                <IconButton
                                  size="small"
                                  onClick={() => openCategoryDialog(category, true)}
                                  color="primary"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Category">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this category?')) {
                                      deleteCostCategory(category.value);
                                    }
                                  }}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {costCategories.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No cost categories found. Add your first category to get started.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Cost Dialog */}
      <Dialog open={costDialogOpen} onClose={() => { setCostDialogOpen(false); setError(null); }} maxWidth="md" fullWidth>
        <DialogTitle>{selectedCost ? 'Edit Cost' : 'Add New Cost'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={costForm.amount}
                onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={costForm.currency}
                  onChange={(e) => setCostForm({ ...costForm, currency: e.target.value })}
                >
                  <MenuItem key="USD" value="USD">USD</MenuItem>
                  <MenuItem key="EUR" value="EUR">EUR</MenuItem>
                  <MenuItem key="GBP" value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={costForm.category}
                  onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
                >
                  {costCategories.filter(cat => cat.isActive !== false).map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Source"
                value={costForm.source}
                onChange={(e) => setCostForm({ ...costForm, source: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={costForm.startDate}
                onChange={(e) => setCostForm({ ...costForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={costForm.endDate}
                onChange={(e) => setCostForm({ ...costForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={costForm.notes}
                onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCostSubmit} variant="contained">
            {selectedCost ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={budgetDialogOpen} onClose={() => setBudgetDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedBudget ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Budget Name"
                value={budgetForm.name}
                onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={budgetForm.description}
                onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Total Budget"
                type="number"
                value={budgetForm.totalBudget}
                onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={budgetForm.currency}
                  onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
                >
                  <MenuItem key="USD" value="USD">USD</MenuItem>
                  <MenuItem key="EUR" value="EUR">EUR</MenuItem>
                  <MenuItem key="GBP" value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={budgetForm.startDate}
                onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={budgetForm.endDate}
                onChange={(e) => setBudgetForm({ ...budgetForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={budgetForm.period}
                  onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                >
                  <MenuItem key="monthly" value="monthly">Monthly</MenuItem>
                  <MenuItem key="quarterly" value="quarterly">Quarterly</MenuItem>
                  <MenuItem key="yearly" value="yearly">Yearly</MenuItem>
                  <MenuItem key="custom" value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBudgetSubmit} variant="contained">
            {selectedBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Costs from File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Upload a CSV or Excel file with cost data. The file should include columns for:
            </Typography>
            <Typography variant="body2" component="div" sx={{ ml: 2 }}>
              • description (required)<br/>
              • amount (required)<br/>
              • currency (optional, defaults to USD)<br/>
              • category (optional, defaults to other)<br/>
              • source (optional)<br/>
              • startDate (required)<br/>
              • endDate (optional, defaults to startDate)
            </Typography>
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<Upload />}>
                  Choose File
                </Button>
              </label>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">Upload Progress: {uploadProgress}%</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained"
            disabled={!uploadFile}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog 
        open={categoryDialog.open} 
        onClose={closeCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {categoryDialog.isEdit ? 'Edit Cost Category' : 'Add New Cost Category'}
        </DialogTitle>
        <DialogContent>
          {categoryDialog.category && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Category Value"
                value={categoryDialog.category.value}
                onChange={(e) => setCategoryDialog({
                  ...categoryDialog,
                  category: { ...categoryDialog.category, value: e.target.value }
                })}
                disabled={categoryDialog.isEdit}
                helperText={categoryDialog.isEdit ? "Cannot change category value after creation" : "Unique identifier for the category"}
              />
              <TextField
                fullWidth
                label="Display Label"
                value={categoryDialog.category.label}
                onChange={(e) => setCategoryDialog({
                  ...categoryDialog,
                  category: { ...categoryDialog.category, label: e.target.value }
                })}
              />
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={categoryDialog.category.color}
                  onChange={(e) => setCategoryDialog({
                    ...categoryDialog,
                    category: { ...categoryDialog.category, color: e.target.value }
                  })}
                >
                  <MenuItem key="default" value="default">Default</MenuItem>
                  <MenuItem key="primary" value="primary">Primary</MenuItem>
                  <MenuItem key="secondary" value="secondary">Secondary</MenuItem>
                  <MenuItem key="error" value="error">Error</MenuItem>
                  <MenuItem key="warning" value="warning">Warning</MenuItem>
                  <MenuItem key="info" value="info">Info</MenuItem>
                  <MenuItem key="success" value="success">Success</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={categoryDialog.category.description}
                onChange={(e) => setCategoryDialog({
                  ...categoryDialog,
                  category: { ...categoryDialog.category, description: e.target.value }
                })}
              />
              <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Active:
                </Typography>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 20, 
                    borderRadius: 10, 
                    bgcolor: categoryDialog.category.isActive ? 'success.main' : 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    px: 0.5,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setCategoryDialog({
                    ...categoryDialog,
                    category: { ...categoryDialog.category, isActive: !categoryDialog.category.isActive }
                  })}
                >
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'white',
                      transform: categoryDialog.category.isActive ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryDialog}>Cancel</Button>
          <Button 
            onClick={categoryDialog.isEdit ? updateCostCategory : addCostCategory} 
            variant="contained"
            disabled={!categoryDialog.category?.value || !categoryDialog.category?.label}
          >
            {categoryDialog.isEdit ? 'Update Category' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostTracking;
