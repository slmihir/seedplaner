import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Assessment,
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  People,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  Info,
  Download,
  Visibility,
  PictureAsPdf,
  TableChart,
  Print
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
import { exportToPDF, exportToCSV, exportToExcel, printReport } from '../utils/exportUtils';

const SprintReports = () => {
  const [reports, setReports] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadProjectId();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadReports();
      loadVelocityData();
    }
  }, [projectId]);

  const loadProjectId = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data.projects && response.data.projects.length > 0) {
        // Try to find a project that has sprint reports
        let projectWithReports = null;
        for (const project of response.data.projects) {
          try {
            const reportsResponse = await api.get(`/sprint-reports/project/${project._id}`);
            if (reportsResponse.data.reports && reportsResponse.data.reports.length > 0) {
              projectWithReports = project._id;
              break;
            }
          } catch (err) {
            // Continue to next project
            continue;
          }
        }
        
        // Use project with reports, or fallback to first project
        setProjectId(projectWithReports || response.data.projects[0]._id);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project data');
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sprint-reports/project/${projectId}`);
      setReports(response.data.reports || []);
      if (response.data.reports && response.data.reports.length > 0) {
        setSelectedReport(response.data.reports[0]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load sprint reports');
    } finally {
      setLoading(false);
    }
  };

  const loadVelocityData = async () => {
    try {
      const response = await api.get(`/sprint-reports/velocity/${projectId}`);
      setVelocityData(response.data.reports || []);
    } catch (error) {
      console.error('Error loading velocity data:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp color="success" />;
      case 'negative':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const getHealthColor = (value, type) => {
    if (type === 'completion') {
      if (value >= 80) return 'success';
      if (value >= 60) return 'warning';
      return 'error';
    }
    if (type === 'effort') {
      if (value <= 20) return 'success';
      if (value <= 40) return 'warning';
      return 'error';
    }
    return 'info';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatHours = (hours) => {
    return `${hours.toFixed(1)}h`;
  };

  const handleExportPDF = async () => {
    if (!selectedReport) return;
    
    try {
      const result = await exportToPDF(selectedReport);
      if (result.success) {
        console.log(`PDF exported successfully: ${result.fileName}`);
      } else {
        console.error('PDF export failed:', result.error);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleExportCSV = () => {
    if (!selectedReport) return;
    
    try {
      const result = exportToCSV(selectedReport);
      if (result.success) {
        console.log(`CSV exported successfully: ${result.fileName}`);
      } else {
        console.error('CSV export failed:', result.error);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportExcel = () => {
    if (!selectedReport) return;
    
    try {
      const result = exportToExcel(selectedReport);
      if (result.success) {
        console.log(`Excel exported successfully: ${result.fileName}`);
      } else {
        console.error('Excel export failed:', result.error);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handlePrintReport = () => {
    try {
      const result = printReport();
      if (!result.success) {
        console.error('Print failed:', result.error);
      }
    } catch (error) {
      console.error('Error printing report:', error);
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportOption = (exportType) => {
    handleExportMenuClose();
    
    switch (exportType) {
      case 'pdf':
        handleExportPDF();
        break;
      case 'csv':
        handleExportCSV();
        break;
      case 'excel':
        handleExportExcel();
        break;
      case 'print':
        handlePrintReport();
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading sprint reports...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadReports}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No Sprint Reports Available
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete a sprint to generate automated reports and view analytics.
        </Typography>
        <Button variant="contained" onClick={loadReports} startIcon={<Refresh />}>
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} id="sprint-report-content">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Sprint Reports & Analytics
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadReports}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            disabled={!selectedReport}
            onClick={handleExportMenuOpen}
          >
            Export Report
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleExportOption('pdf')}>
              <ListItemIcon>
                <PictureAsPdf fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportOption('excel')}>
              <ListItemIcon>
                <TableChart fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportOption('csv')}>
              <ListItemIcon>
                <TableChart fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as CSV</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExportOption('print')}>
              <ListItemIcon>
                <Print fontSize="small" />
              </ListItemIcon>
              <ListItemText>Print Report</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Velocity Trends" />
          <Tab label="Team Performance" />
          <Tab label="Effort Analysis" />
          <Tab label="Sprint Health" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Recent Reports */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Sprint Reports
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sprint</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Velocity</TableCell>
                        <TableCell>Completion</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.slice(0, 5).map((report) => (
                        <TableRow key={report._id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {report.sprintName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(report.startDate)} - {formatDate(report.endDate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${report.velocity} pts`}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${report.sprintHealth?.completionRate?.toFixed(1) || 0}%`}
                              color={getHealthColor(report.sprintHealth?.completionRate, 'completion')}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Visibility />
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

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                {selectedReport && (
                  <>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Total Issues:</Typography>
                      <Typography variant="h6">{selectedReport.totalIssues}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Completed:</Typography>
                      <Typography variant="h6" color="success.main">
                        {selectedReport.completedIssues}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Velocity:</Typography>
                      <Typography variant="h6" color="primary.main">
                        {selectedReport.velocity} pts
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Effort Variance:</Typography>
                      <Typography 
                        variant="h6" 
                        color={selectedReport.effortVariance >= 0 ? 'error.main' : 'success.main'}
                      >
                        {formatHours(Math.abs(selectedReport.effortVariance))}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Velocity Trends Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Velocity Trends Over Time
                </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sprintName" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="velocity"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="Velocity (Story Points)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Team Performance Tab */}
      {activeTab === 2 && selectedReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedReport.teamMembers || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="member.name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="issuesCompleted" fill="#8884d8" name="Issues Completed" />
                      <Bar dataKey="storyPointsCompleted" fill="#82ca9d" name="Story Points" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Member Details
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell align="right">Issues</TableCell>
                        <TableCell align="right">Completed</TableCell>
                        <TableCell align="right">Story Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedReport.teamMembers || []).map((member, index) => (
                        <TableRow key={index}>
                          <TableCell>{member.member?.name || 'Unknown'}</TableCell>
                          <TableCell align="right">{member.issuesAssigned}</TableCell>
                          <TableCell align="right">{member.issuesCompleted}</TableCell>
                          <TableCell align="right">{member.storyPointsCompleted}</TableCell>
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

      {/* Effort Analysis Tab */}
      {activeTab === 3 && selectedReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Effort Planning vs Spent
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      {
                        name: 'Estimated',
                        hours: selectedReport.totalEstimatedHours
                      },
                      {
                        name: 'Actual',
                        hours: selectedReport.totalActualHours
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => formatHours(value)} />
                      <Bar dataKey="hours" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Effort Metrics
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Total Estimated:</Typography>
                    <Typography variant="h6">{formatHours(selectedReport.totalEstimatedHours)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Total Actual:</Typography>
                    <Typography variant="h6">{formatHours(selectedReport.totalActualHours)}</Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Variance:</Typography>
                    <Typography 
                      variant="h6"
                      color={selectedReport.effortVariance >= 0 ? 'error.main' : 'success.main'}
                    >
                      {formatHours(Math.abs(selectedReport.effortVariance))}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Accuracy:</Typography>
                    <Typography 
                      variant="h6"
                      color={getHealthColor(100 - selectedReport.sprintHealth?.effortAccuracy, 'effort')}
                    >
                      {selectedReport.sprintHealth?.effortAccuracy?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sprint Health Tab */}
      {activeTab === 4 && selectedReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sprint Health Metrics
                </Typography>
                <Box display="flex" flexDirection="column" gap={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle color={getHealthColor(selectedReport.sprintHealth?.completionRate, 'completion')} />
                    <Box>
                      <Typography variant="body2">Completion Rate</Typography>
                      <Typography variant="h6">
                        {selectedReport.sprintHealth?.completionRate?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Schedule color={getHealthColor(100 - selectedReport.sprintHealth?.effortAccuracy, 'effort')} />
                    <Box>
                      <Typography variant="body2">Effort Accuracy</Typography>
                      <Typography variant="h6">
                        {selectedReport.sprintHealth?.effortAccuracy?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    {getTrendIcon(selectedReport.sprintHealth?.velocityTrend)}
                    <Box>
                      <Typography variant="body2">Velocity Trend</Typography>
                      <Typography variant="h6" textTransform="capitalize">
                        {selectedReport.sprintHealth?.velocityTrend || 'stable'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sprint Insights
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {(selectedReport.insights || []).map((insight, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2}>
                      {getTrendIcon(insight.trend)}
                      <Box>
                        <Typography variant="subtitle2">{insight.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {insight.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SprintReports;