import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon, Button, Input, Loader, Message } from 'semantic-ui-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './ClientDetails.css';
import { IoMdClose } from "react-icons/io"; 

const ClientProjects = () => {
  const { clientId } = useParams(); // Get the clientId from the URL
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // State variables
  const [projects, setProjects] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state before fetching

        const allocatedResponse = await fetch(`http://localhost:5000/client/${clientId}/projects`);
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');

        if (!allocatedResponse.ok || !benchedResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();

        setProjects(allocatedData);
        setBenchedEmployees(benchedData);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to fetch project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [clientId]);

  // Format client name from clientId
  const clientName = clientId
    ? clientId.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : "Project Details";

  // Handle project row click
  const handleProjectClick = (projectName) => {
    navigate(`/client/${clientId}/project/${projectName.toLowerCase().replace(/ /g, '-')}`);
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sorting
  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }

    // Toggle sort direction
    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => {
    const term = searchTerm.toLowerCase();
    return (
      project.ProjectName.toLowerCase().includes(term) ||
      project.Status.toLowerCase().includes(term) ||
      project.Category.toLowerCase().includes(term)
    );
  });

  // Sort projects based on sortColumn and sortDirection
  const sortedProjects = React.useMemo(() => {
    if (!sortColumn) return filteredProjects;

    const sorted = [...filteredProjects].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal > bVal) return sortDirection === 'ascending' ? 1 : -1;
      if (aVal < bVal) return sortDirection === 'ascending' ? -1 : 1;
      return 0;
    });

    return sorted;
  }, [filteredProjects, sortColumn, sortDirection]);

  // Download data to Excel
  const downloadExcel = () => {
    if (sortedProjects.length === 0) {
      alert('No data available to download.');
      return;
    }

    // Define the data to export
    const dataToExport = sortedProjects.map(project => ({
      'Project Name': project.ProjectName,
      'Status': project.Status,
      'Category': project.Category,
      // Add more fields as needed
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    // Create a blob from the buffer
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    // Save the file
    saveAs(data, 'projects.xlsx');
  };

  return (
    <div className='main-layout'>
      <div className='right-content'>
        <div className='breadcrumb'>
          {/* Back Arrow Icon */}
          <Icon 
            name="arrow left" 
            size="large" 
            className="icon"
            onClick={handleBackClick} 
            style={{ cursor: 'pointer' }}
          />
          
          {/* Previous Screen Link */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/projects')}
            style={{ cursor: 'pointer', display: 'inline', marginLeft: '10px' }}
          >
            Clients
          </h2>
        
          {/* Divider between breadcrumb items */}
          <span className="breadcrumb-divider"> / </span>
          
          {/* Current Client Name */}
          <h2 className="breadcrumb-text" style={{ display: 'inline' }}>
            {`Projects for ${clientName}`}
          </h2>
        </div>

        {/* Search and Download Container */}
        <div className="controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          {/* Search Bar */}
          <Input
            icon="search"
            placeholder="Search by project name, status, or category..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-bar"
            style={{ marginRight: '10px', width: '300px' }}
          />

          {/* Download Button */}
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
                  <Table.HeaderCell
                    sorted={sortColumn === 'ProjectName' ? sortDirection : null}
                    onClick={() => handleSort('ProjectName')}
                    style={{ cursor: 'pointer' }}
                  >
                    Project Name
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'Status' ? sortDirection : null}
                    onClick={() => handleSort('Status')}
                    style={{ cursor: 'pointer' }}
                  >
                    Status
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'Category' ? sortDirection : null}
                    onClick={() => handleSort('Category')}
                    style={{ cursor: 'pointer' }}
                  >
                    Category
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedProjects.length > 0 ? (
                  sortedProjects.map((project) => (
                    <Table.Row
                      key={project.ProjectID || project.ProjectName} // Use a unique identifier
                      onClick={() => handleProjectClick(project.ProjectName)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <Icon name="folder" /> {project.ProjectName}
                      </Table.Cell>
                      <Table.Cell>{project.Status}</Table.Cell>
                      <Table.Cell>{project.Category}</Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="3" textAlign="center">
                      No matching projects found.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProjects;
