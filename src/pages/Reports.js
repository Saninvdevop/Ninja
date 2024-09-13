import React, { useState, useEffect } from 'react';
import { Table, Dropdown } from 'semantic-ui-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv'; // Import CSVLink from react-csv
import './Reports.css';

const Reports = () => {
  const location = useLocation(); // Use useLocation to access the state
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const [combinedEmployeeData, setCombinedEmployeeData] = useState([]);
  const [bench, setBench] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCombinedEmployeeData = async () => {
      try {
        const [allocatedResponse, benchResponse] = await Promise.all([
          fetch('http://localhost:5000/employees/drafts'),
          fetch('http://localhost:5000/employees/todo')
        ]);

        if (!allocatedResponse.ok || !benchResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const [dataAllocated, dataBenched] = await Promise.all([
          allocatedResponse.json(),
          benchResponse.json()
        ]);

        console.log('Fetched data:', { dataAllocated, dataBenched }); // Log data for debugging
        setCombinedEmployeeData(dataAllocated);
        setBench(dataBenched);

        // Set initial filtered data based on default filter
        setFilteredData(dataAllocated); // Default is 'allocated'
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCombinedEmployeeData();
  }, []);

  useEffect(() => {
    if (location.state && location.state.filter) {
      setFilter(location.state.filter); // Set the filter from state if available
    }
  }, [location.state]);

  const handleFilterChange = (e, { value }) => {
    setFilter(value);
    
    // Correct filter logic
    if (value === 'allocated') {
      setFilteredData(combinedEmployeeData); // Show allocated data
    } else if (value === 'on Bench') {
      setFilteredData(bench); // Show bench data
    }
  };

  const handleRowClick = (employee) => {
    navigate('/employee/' + employee.EmployeeID, { state: { employee: { ...employee, allocation: employee.Allocation } } });
  };

  const csvData = filteredData.map((employee) => ({
    'Employee ID': employee.EmployeeID,
    'Employee Name': employee.EmployeeName,
    Email: employee.Email,
    Role: employee.Role,
    'Current Allocation %': employee.Allocation, // Ensure this matches the field name from the API
  }));

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="reports-container">
      <h2 className="reports-header">Reports</h2>

      <Dropdown
        placeholder="Filter by Allocation"
        fluid
        selection
        options={[
          { key: 'on Bench', text: 'on Bench', value: 'on Bench' },
          { key: 'allocated', text: 'allocated', value: 'allocated' },
        ]}
        value={filter}
        onChange={handleFilterChange}
        className="filter-dropdown"
      />

      <CSVLink 
        data={csvData} 
        filename={"employee-reports.csv"} 
        className="ui button primary csv-download-button"
      >
        Download CSV
      </CSVLink>

      <Table celled striped className="reports-employee-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee ID</Table.HeaderCell>
            <Table.HeaderCell>Employee Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {filteredData.length > 0 ? (
            filteredData.map((employee) => (
              <Table.Row key={employee.EmployeeID} onClick={() => handleRowClick(employee)}>
                <Table.Cell>{employee.EmployeeID}</Table.Cell>
                <Table.Cell>{employee.EmployeeName}</Table.Cell>
                <Table.Cell>{employee.Email}</Table.Cell>
                <Table.Cell>{employee.Role}</Table.Cell>
                <Table.Cell>{employee.Allocation}%</Table.Cell> {/* Ensure this matches the field name from the API */}
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan="5">No data available</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
};

export default Reports;
