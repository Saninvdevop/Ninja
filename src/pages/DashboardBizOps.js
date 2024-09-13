import React, { useEffect, useState } from 'react';
import { Card, Table, Segment, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './DashboardBizOps.css'; // Import CSS for consistent styling

const DashboardBizOps = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Hardcoded data for the cards
  const [todo, setTodo] = useState();
  const [draft, setDraft] = useState();
  const activeProjects = 80;

  // Hardcoded data for the table
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state
  const [totalemp, setTotalEmp] = useState();

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch('http://localhost:5000/employees/drafts');
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');
        const totalresponse = await fetch('http://localhost:5000/employees');
        if (!allocatedResponse.ok || !benchedResponse.ok || !totalresponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();
        const total = await totalresponse.json();
        setDraft(allocatedData.length);
        setAllocatedEmployees(allocatedData);
        setTodo(benchedData.length);
        setBenchedEmployees(benchedData);
        setTotalEmp(total.length);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Function to navigate to Unallocated page
  const handleUnallocatedClick = () => {
    navigate('/unallocated');
  };

  // Function to navigate to ToDo page
  const handleToDoClick = () => {
    navigate('/todo');
  };

  // Function to navigate to EmpPage
  const handleEmployeeDetailsClick = () => {
    navigate('/employees'); // Adjust this path to match your App.js route
  };

  // Function to navigate to Projects page
  const handleProjectAllocationClick = () => {
    navigate('/projects'); // Navigate to the projects route
  };

  return (
    <div className="dashboard-bizops-container">
      <Segment className="content-wrapper">
        {/* Personalized Greeting and Message */}
        <div className="greeting-section">
          <h2 className='bizopname'>Hello Ravi,</h2>
          <p className="instruction-message">Pick where you left from</p>
        </div>

        {/* Cards Section */}
        <Card.Group itemsPerRow={3} className="bizops-cards">
          <Card className="interactive-card" onClick={handleUnallocatedClick}>
            <Card.Content>
              <Icon name="users" className="card-icon" />
              <Card.Header className="card-heading">Drafts</Card.Header>
              <Card.Description className="card-value">{draft}</Card.Description>
            </Card.Content>
          </Card>
          <Card className="interactive-card" onClick={handleToDoClick}>
            <Card.Content>
              <Icon name="edit" className="card-icon" />
              <Card.Header className="card-heading">0% Allocated</Card.Header>
              <Card.Description className="card-value1">{todo}</Card.Description>
            </Card.Content>
          </Card>
          {/* Updated Project Allocation Card with onClick handler */}
          <Card className="interactive-card" onClick={handleProjectAllocationClick}>
            <Card.Content>
              <Icon name="briefcase" className="card-icon" />
              <Card.Header className="card-heading">Project Allocation</Card.Header>
              <Card.Description className="card-value2">{activeProjects}</Card.Description>
            </Card.Content>
          </Card>
          {/* New Card for Employee Details */}
          <Card className="interactive-card" onClick={handleEmployeeDetailsClick}>
            <Card.Content>
              <Icon name="users" className="card-icon" />
              <Card.Header className="card-heading">Employee Details</Card.Header>
              <Card.Description className="card-value3">Click to view</Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>

        {/* Table Section */}
        <h1 className='drafts'>Drafts</h1>
        <Table celled striped className="employee-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Employee ID</Table.HeaderCell>
              <Table.HeaderCell>Employee Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {allocatedEmployees.map((employee) => (
              <Table.Row key={employee.EmployeeID}>
                <Table.Cell>{employee.EmployeeID}</Table.Cell>
                <Table.Cell>{employee.EmployeeName}</Table.Cell>
                <Table.Cell>{employee.Email}</Table.Cell>
                <Table.Cell>{employee.Allocation}%</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Segment>
    </div>
  );
};

export default DashboardBizOps;
