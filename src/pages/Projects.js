// Clients Page
import React, { useState, useEffect } from 'react';
import { Table, Icon, Button, Input } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './Projects.css';

const Projects = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const handleRowClick = (clientId) => {
    navigate(`/client/${clientId}/projects`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const downloadExcel = () => {
    const dataToExport = filteredAndSortedData.map(client => ({
      'Client ID': client.ClientID,
      Company: client.ClientName,
      'No. of Projects': client.NoOfProjects,
      Country: client.ClientCountry,
      "Client Partner": client.ClientPartner,
      Headcount: client.Headcount // Add Headcount to Excel
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'clients.xlsx');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/clients');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setClientData(data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = clientData.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      client.ClientName.toLowerCase().includes(term) ||
      client.ClientCountry.toLowerCase().includes(term) ||
      client.ClientPartner.toLowerCase().includes(term) ||
      String(client.ClientID).includes(term)
    );
  });

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortColumn, sortDirection]);

  const filteredAndSortedData = sortedData;

  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }

    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };

  

  return (
    <div className='main-layout'>
      <div className='right-content'>
        <div className='breadcrumb'>
          <h2 className="breadcrumb-text">Clients</h2>
        </div>
        <div className="controls">
            
           <Input
              icon="search"
              placeholder="Search Client"
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
              style={{ marginRight: '10px', width: '300px' }}
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
      
        <div className='table'>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table celled striped selectable sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientID' ? sortDirection : null}
                    onClick={() => handleSort('ClientID')}
                  >
                    Client ID
                  </Table.HeaderCell>
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
                    sorted={sortColumn === 'ClientCountry' ? sortDirection : null}
                    onClick={() => handleSort('ClientCountry')}
                  >
                    Country
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientPartner' ? sortDirection : null}
                    onClick={() => handleSort('ClientPartner')}
                  >
                    Client Partner
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'Headcount' ? sortDirection : null}
                    onClick={() => handleSort('Headcount')}
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
                      onClick={() => handleRowClick(client.ClientID)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>{client.ClientID}</Table.Cell>
                      <Table.Cell>
                        <Icon name="building" /> {client.ClientName}
                      </Table.Cell>
                      <Table.Cell>{client.NoOfProjects}</Table.Cell>
                      <Table.Cell>{client.ClientCountry}</Table.Cell>
                      <Table.Cell>{client.ClientPartner}</Table.Cell>
                      <Table.Cell>{client.Headcount}</Table.Cell> {/* Render Headcount */}
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="5" textAlign="center">
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
