// inside Clients -> Projects
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon, Button, Input, Loader, Message } from 'semantic-ui-react';
import './ClientDetails.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
 
const ClientProjects = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
 
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('in progress'); // Add filter state
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
 
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 20; // Number of projects per page
 
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
 
        const response = await fetch(`http://localhost:8080/client/${clientId}/projects`);
 
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
 
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to fetch project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
 
    fetchProjects();
  }, [clientId]);
 
  const handleBackClick = () => {
    navigate(-1);
  };
 
  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
    setCurrentPage(1); // Reset to the first page on filter change
  };
 
  // Apply filters based on the selected status filter
  const filteredProjects = projects.filter(project => {
    const term = searchTerm.toLowerCase();
    const matchesSearchTerm = (
      String(project.ProjectID).includes(term) ||
      project.ProjectName.toLowerCase().includes(term) ||
      project.ProjectStatus.toLowerCase().includes(term) ||
      project.ProjectManager.toLowerCase().includes(term)
    );
 
    const matchesFilter = filter === 'all' || project.ProjectStatus.toLowerCase() === filter;
   
    return matchesSearchTerm && matchesFilter;
  });
 
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page on search
  };
 
  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }
    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };
 
  const sortedProjects = React.useMemo(() => {
    if (!sortColumn) return filteredProjects;
 
    return [...filteredProjects].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
 
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
 
      if (aVal > bVal) return sortDirection === 'ascending' ? 1 : -1;
      if (aVal < bVal) return sortDirection === 'ascending' ? -1 : 1;
      return 0;
    });
  }, [filteredProjects, sortColumn, sortDirection]);
 
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'grey';
      case 'In Progress': return 'green';
      case 'On Hold': return 'yellow';
      default: return 'grey';
    }
  };
 
  const downloadExcel = () => {
    const data = sortedProjects.map((project) => ({
      ClientId: clientId, // Adding ClientId to each row
      ProjectID: project.ProjectID,
      ProjectName: project.ProjectName,
      ProjectStatus: project.ProjectStatus,
      ProjectManager: project.ProjectManager,
      ProjectStartDate: new Date(project.ProjectStartDate).toLocaleDateString(),
      ProjectEndDate: project.ProjectEndDate ? new Date(project.ProjectEndDate).toLocaleDateString() : 'Ongoing',
      Headcount: project.Headcount
    }));
 
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Projects');
 
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Client_${clientId}_Projects.xlsx`);
  };
 
  const handleProjectClick = (projectId) => {
    navigate(`/client/${clientId}/project/${projectId}`);
  };
 
  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(sortedProjects.length / projectsPerPage);
 
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
 
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
 
  return (
    <div className='main-layout'>
      <div className='right-content'>
        <div className='breadcrumb'>
          <Icon
            name="arrow left"
            size="large"
            className="icon"
            onClick={handleBackClick}
            style={{ cursor: 'pointer' }}
          />
         
          <h2
            className="breadcrumb-text"
            onClick={() => navigate('/projects')}
            style={{ cursor: 'pointer', display: 'inline', marginLeft: '10px' }}
          >
            Clients
          </h2>
       
          <span className="breadcrumb-divider"> / </span>
         
          <h2 className="breadcrumb-text" style={{ display: 'inline' }}>
            {projects[0]?.ClientName || 'Loading...'}
          </h2>
        </div>
 
        <div className="controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="filter-tabs" style={{ display: 'flex', gap: '10px', flexGrow: 1 }}>
            <button
              className={`tab ${filter === 'in progress' ? 'active' : ''}`}
              onClick={() => handleFilterChange('in progress')}
            >
              In Progress
            </button>
            <button
              className={`tab ${filter === 'on hold' ? 'active' : ''}`}
              onClick={() => handleFilterChange('on hold')}
            >
              On Hold
            </button>
            <button
              className={`tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('completed')}
            >
              Completed
            </button>
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
          </div>
         
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Input
              icon="search"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
              style={{ width: '300px' }}
            />
            <Button
              icon
              labelPosition="left"
              color="blue"
              onClick={downloadExcel}
              className="download-button"
            >
              <Icon name="download" />
              Download
            </Button>
          </div>
        </div>

 
        <div className='table'>
          {loading ? (
            <Loader active inline='centered'>Loading Projects...</Loader>
          ) : error ? (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          ) : (
            <Table celled striped selectable sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell sorted={sortColumn === 'ProjectID' ? sortDirection : null} onClick={() => handleSort('ProjectID')}>Project ID</Table.HeaderCell>
                  <Table.HeaderCell sorted={sortColumn === 'ProjectName' ? sortDirection : null} onClick={() => handleSort('ProjectName')}>Project Name</Table.HeaderCell>
                  <Table.HeaderCell sorted={sortColumn === 'ProjectStatus' ? sortDirection : null} onClick={() => handleSort('ProjectStatus')}>Project Status</Table.HeaderCell>
                  <Table.HeaderCell sorted={sortColumn === 'ProjectManager' ? sortDirection : null} onClick={() => handleSort('ProjectManager')}>Project Manager</Table.HeaderCell>
                  <Table.HeaderCell>Start Date</Table.HeaderCell>
                  <Table.HeaderCell>End Date</Table.HeaderCell>
                  <Table.HeaderCell>Headcount</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentProjects.map(project => (
                  <Table.Row key={project.ProjectID} onClick={() => handleProjectClick(project.ProjectID)}>
                    <Table.Cell>{project.ProjectID}</Table.Cell>
                    <Table.Cell>{project.ProjectName}</Table.Cell>
                    <Table.Cell style={{ color: getStatusColor(project.ProjectStatus) }}>{project.ProjectStatus}</Table.Cell>
                    <Table.Cell>{project.ProjectManager}</Table.Cell>
                    <Table.Cell>{new Date(project.ProjectStartDate).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>{project.ProjectEndDate ? new Date(project.ProjectEndDate).toLocaleDateString() : 'Ongoing'}</Table.Cell>
                    <Table.Cell>{project.Headcount}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
 
        {/* Pagination controls */}
        <div className="pagination">
          <Button
            disabled={currentPage === 1}
            onClick={handlePrevPage}
          >
            Previous
          </Button>
         
          {/* Updated current page display */}
          <span className="current-page">
            {currentPage}
          </span>
         
          <Button
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
 
export default ClientProjects;