import React, { useState, useEffect } from 'react';
import { Table, Icon, Button, Input } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './Projects.css';

const Projects = ({ userRole }) => { // Receive userRole as a prop
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // For navigation
  const [clientData, setClientData] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state

  // Sorting state
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const handleRowClick = (clientId) => {
    navigate(`/client/${clientId}/projects`); // Navigate to the client projects page
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Download data to Excel
  const downloadExcel = () => {
    // Define the data to export
    const dataToExport = filteredAndSortedData.map(client => ({
      Company: client.ClientName,
      'No. of Projects': client.NoOfProjects,
      Country: client.Country,
      'Contract Start Date': client.StartDate,
      'Contract End Date': client.EndDate,
      Headcount: client.NoOfEmployees,
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    // Create a blob from the buffer
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    // Save the file
    saveAs(data, 'clients.xlsx');
  };

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const allocatedResponse = await fetch('http://localhost:5000/clients');
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');
        
        if (!allocatedResponse.ok || !benchedResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();

        setClientData(allocatedData);
        setBenchedEmployees(benchedData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Filter data based on search term
  const filteredData = clientData.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      client.ClientName.toLowerCase().includes(term) ||
      (client.Email && client.Email.toLowerCase().includes(term)) || // Ensure Email exists
      String(client.ClientID).includes(term)
    );
  });

  // Sort data based on sortColumn and sortDirection
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortColumn, sortDirection]);

  // Combined filtered and sorted data
  const filteredAndSortedData = sortedData;

  // Handle sorting when a header is clicked
  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }

    // Toggle sort direction
    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };

  return (
    <div className='main-layout'>
      <div className='right-content'>
        {/* Breadcrumb Section */}
        <div className='breadcrumb'>
          <h2 className="breadcrumb-text">Clients</h2>
        </div>
        {/* Search and Download Container */}
        <div className="controls">
           {/* Search Bar */}
           <Input
              icon="search"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
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
            <div>Loading...</div>
          ) : (
            <Table celled striped selectable sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientName' ? sortDirection : null}
                    onClick={() => handleSort('ClientName')}
                  >
                    Company
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'NoOfProjects' ? sortDirection : null}
                    onClick={() => handleSort('NoOfProjects')}
                  >
                    No. of Projects
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'Country' ? sortDirection : null}
                    onClick={() => handleSort('Country')}
                  >
                    Country
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'StartDate' ? sortDirection : null}
                    onClick={() => handleSort('StartDate')}
                  >
                    Contract Start Date
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'EndDate' ? sortDirection : null}
                    onClick={() => handleSort('EndDate')}
                  >
                    Contract End Date
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'NoOfEmployees' ? sortDirection : null}
                    onClick={() => handleSort('NoOfEmployees')}
                  >
                    Headcount
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((client) => (
                    <Table.Row
                      key={client.ClientID}
                      onClick={() => handleRowClick(client.ClientID)} // Ensure correct navigation
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <Icon name="building" /> {client.ClientName}
                      </Table.Cell>
                      <Table.Cell>{client.NoOfProjects}</Table.Cell>
                      <Table.Cell>{client.Country}</Table.Cell>
                      <Table.Cell>{client.StartDate}</Table.Cell>
                      <Table.Cell>{client.EndDate}</Table.Cell>
                      <Table.Cell>{client.NoOfEmployees}</Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="6" textAlign="center">
                      No matching clients found.
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

export default Projects;
