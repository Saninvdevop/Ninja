import React ,{useEffect,useState}from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'semantic-ui-react';

const Unallocated = () => {
  const navigate = useNavigate();

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

        setAllocatedEmployees(allocatedData);
        setBenchedEmployees(benchedData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  const handleEmployeeClick = (employee) => {
    // Navigate to EmployeeDetails with the allocation percentage and other data
    navigate(`/employee/${employee.EmployeeID}`, {
      state: {
        employee,
        allocationPercentage: employee.current_allocation, // Pass the current allocation percentage
      },
    });
  };

  return (
    <div className="unallocated-container">
      <h2>Unallocated Employees</h2>
      <Table celled striped>
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
            <Table.Row key={employee.EmployeeID} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
              <Table.Cell>{employee.EmployeeID}</Table.Cell>
              <Table.Cell>{employee.EmployeeName}</Table.Cell>
              <Table.Cell>{employee.Email}</Table.Cell>
              <Table.Cell>{employee.Allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default Unallocated;
