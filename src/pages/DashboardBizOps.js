import React, {useEffect,useState} from 'react';
import { Card, Table, Segment, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './DashboardBizOps.css'; // Import CSS for consistent styling

const DashboardBizOps = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Hardcoded data for the cards
  const [todo,setTodo]=useState();
  const [draft,setDraft] = useState();
  const activeProjects = 80;

  // Hardcoded data for the table
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch('http://localhost:5000/employees/drafts');
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');
        
        if (!allocatedResponse.ok || !benchedResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();
        setDraft(allocatedData.length)
        setAllocatedEmployees(allocatedData);
        setTodo(benchedData.length)
        setBenchedEmployees(benchedData);
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
    navigate('/todo'); // Navigate to the ToDoPage when clicking the To Do card
  };

  return (
    <div className="dashboard-bizops-container">
      <Segment className="content-wrapper">
        {/* Personalized Greeting and Message */}
        <div className="greeting-section">
          <h2 className='bizopname'>Hello Ravi,</h2>
          <p className="instruction-message">Pick where you left from </p>
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
          <Card className="interactive-card" onClick={handleToDoClick}> {/* Updated onClick event */}
            <Card.Content>
              <Icon name="edit" className="card-icon" />
              <Card.Header className="card-heading">To Do</Card.Header>
              <Card.Description className="card-value1">{todo}</Card.Description>
            </Card.Content>
          </Card>
          <Card className="interactive-card">
            <Card.Content>
              <Icon name="briefcase" className="card-icon" />
              <Card.Header className="card-heading">Active Projects</Card.Header>
              <Card.Description className="card-value2">{activeProjects}</Card.Description>
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
