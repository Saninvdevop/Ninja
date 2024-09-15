import React, {useEffect,useState}from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon } from 'semantic-ui-react';
import './ClientDetails.css';

const ClientProjects = () => {
  const { clientId } = useParams(); // Get the clientId from the URL
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Mock data for projects by client company
  const [projects, setAllocatedEmployees] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state
  
  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch(`http://localhost:8080/client/${clientId}/projects`);
        const benchedResponse = await fetch('http://localhost:8080/employees/todo');
        
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

  const clientName = clientId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
   // Get projects for the current client

  const handleProjectClick = (projectName) => {
    navigate(`/client/${clientId}/project/${projectName.toLowerCase().replace(/ /g, '-')}`); // Navigate to project details page with clientId and projectId
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className='main-layout'>
      <div className="client-details-container">
      {/* Back Arrow Icon */}
      <Icon name="arrow left" size="large" style={{ cursor: 'pointer', marginBottom: '20px' }} onClick={handleBackClick} />

      <h2 className='headingproj'>Projects for {clientName}</h2>
      <Table celled padded className="employee-table3">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Project Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {projects.map((project, index) => (
            <Table.Row
              key={index}
              onClick={() => handleProjectClick(project.ProjectName)}
              style={{ cursor: 'pointer' }}
            >
              <Table.Cell>
                <Icon name="folder" /> {project.ProjectName}
              </Table.Cell>
              <Table.Cell>{project.Status}</Table.Cell>
              <Table.Cell>{project.Category}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
    </div>
  );
};

export default ClientProjects;
