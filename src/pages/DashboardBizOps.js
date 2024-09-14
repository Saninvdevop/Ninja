import React, { useEffect, useState } from 'react';
import { Card, Table, Segment, Icon, Grid } from 'semantic-ui-react';
import ViewCard from '../components/ViewCards/Viewcard'; // Import ViewCard component
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './DashboardBizOps.css'; // Import CSS for consistent styling

const DashboardBizOps = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const [currentDate, setCurrentDate] = useState(''); // State to hold current date

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

  useEffect(() => {
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);
  setCurrentDate(formattedDate); // Removed the 's'
}, []);

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
    <div className="main-layout">
      <div className='right-content w-100'>
        <div className='top-content'>
          <div className='greeting'>
            <h1>Hello Ravi,</h1>
            <h2>{currentDate}</h2>
          </div>
        </div>
        <div className='bottom-content-cards'>
          <div className='cards'>
            <ViewCard
              icon="fa-users"
              header="Unallocated"
              value={todo}
              onClick={handleToDoClick}
            />
          </div>
          <div className='cards'>
            <ViewCard
              icon="fa-users"
              header="Drafts"
              value={draft}
              onClick={handleUnallocatedClick}
            />
          </div>
          <div className='cards'>
            <ViewCard
              icon="fa-users"
              header="Drafts"
              value={draft}
              onClick={handleUnallocatedClick}
            />
          </div>
          <div className='cards'>
            <ViewCard
              icon="fa-users"
              header="Drafts"
              value={draft}
              onClick={handleUnallocatedClick}
            />
          </div>
        </div>
        <div className='last-edited'>
            <h2>Pick Where you left from,</h2>
              <div className='table'>
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
              </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBizOps;
