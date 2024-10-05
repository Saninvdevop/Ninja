import React, { useState, useEffect } from 'react';
import { Container, Header, Grid, Segment, Table, Progress, List } from 'semantic-ui-react';
import LineChart from '../components/LeaderChart/LineChart';
import 'semantic-ui-css/semantic.min.css';
import './Dashboard.css';

const Dashboard = () => {
  const [clientData, setClientData] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [projectData, setProjectData] = useState([]);
  const [currentStatusType, setCurrentStatusType] = useState('Completed');

  // Fetch clients from the backend API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/clients');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Clients data:', data);
        setClientData(data);
        setSelectedClientId(data[0]?.ClientID); // Set the first client as selected by default
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    fetchClients();
  }, []);

  // Fetch project data based on selected client
  useEffect(() => {
    const fetchProjects = async () => {
      if (selectedClientId) {
        console.log(`Fetching projects for Client ID: ${selectedClientId}`); // Debugging statement
        try {
          const response = await fetch(`http://localhost:8080/api/client/${selectedClientId}/projects`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log(`Project data for Client ID ${selectedClientId}:`, data); // Debugging statement
          setProjectData(data);
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      }
    };
    fetchProjects();
  }, [selectedClientId]);

  // Handle status click to filter project status
  const handleStatusClick = (status) => {
    setCurrentStatusType(status);
  };

  // Calculate project statistics
  const completedProjects = projectData.filter(project => project.ProjectStatus === 'Completed').length;
  const onHoldProjects = projectData.filter(project => project.ProjectStatus === 'On Hold').length;
  const inProgressProjects = projectData.filter(project => project.ProjectStatus === 'In Progress').length;
  const totalProjects = projectData.length;

  return (
    <Container fluid className="dashboard-container">
      <div className="dashboard-content">
        <Segment basic className="greeting">
          <Header as='h1'>Hello, Admin</Header>
          <Header as='h2' className="date">{new Date().toLocaleDateString()}</Header>
        </Segment>

        <Segment className="dashboard-chart">
          <LineChart />
        </Segment>

        <Grid columns={2} divided className="client-project-container">
          <Grid.Row stretched>
            <Grid.Column width={5}>
              <Segment className="client-details-table" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Header as='h3'>Client Details</Header>
                <Table selectable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Client Name</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {clientData.map((client) => (
                      <Table.Row key={client.ClientID} onClick={() => {
                        console.log(`Selected Client ID: ${client.ClientID}`); // Debugging statement
                        setSelectedClientId(client.ClientID);
                      }}>
                        <Table.Cell>{client.ClientName}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            </Grid.Column>
            <Grid.Column width={11}>
              <Segment className="project-details-table">
                <Header as='h3'>Project Details</Header>
                {projectData.length > 0 ? (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Project</Table.HeaderCell>
                        <Table.HeaderCell>Status</Table.HeaderCell>
                        <Table.HeaderCell>Project Manager</Table.HeaderCell>
                        <Table.HeaderCell>Start Date</Table.HeaderCell>
                        <Table.HeaderCell>End Date</Table.HeaderCell>
                        <Table.HeaderCell>Headcount</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {projectData.map((project) => (
                        <Table.Row key={project.ProjectID}>
                          <Table.Cell>{project.ProjectName}</Table.Cell>
                          <Table.Cell>{project.ProjectStatus}</Table.Cell>
                          <Table.Cell>{project.ProjectManager}</Table.Cell>
                          <Table.Cell>{new Date(project.ProjectStartDate).toLocaleDateString()}</Table.Cell>
                          <Table.Cell>{new Date(project.ProjectEndDate).toLocaleDateString()}</Table.Cell>
                          <Table.Cell>{project.Headcount}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <p>No projects found for this client.</p>
                )}
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Grid columns={2} divided className="project-section-container">
          <Grid.Row>
            <Grid.Column>
              <Segment className="project-statistics">
                <Header as='h3'>Project Statistics</Header>
                <Segment className="stat-item" onClick={() => handleStatusClick('Completed')}>
                  <Header as='h4'>Completed</Header>
                  <Progress percent={totalProjects ? (completedProjects / totalProjects) * 100 : 0} progress className="completed">
                    {completedProjects} / {totalProjects}
                  </Progress>
                </Segment>
                <Segment className="stat-item" onClick={() => handleStatusClick('On Hold')}>
                  <Header as='h4'>On Hold</Header>
                  <Progress percent={totalProjects ? (onHoldProjects / totalProjects) * 100 : 0} progress className="on-hold">
                    {onHoldProjects} / {totalProjects}
                  </Progress>
                </Segment>
                <Segment className="stat-item" onClick={() => handleStatusClick('In Progress')}>
                  <Header as='h4'>In Progress</Header>
                  <Progress percent={totalProjects ? (inProgressProjects / totalProjects) * 100 : 0} progress className="in-progress">
                    {inProgressProjects} / {totalProjects}
                  </Progress>
                </Segment>
              </Segment>
            </Grid.Column>

            <Grid.Column>
              <Segment className="project-status">
                <Header as='h3'>Project Status - {currentStatusType}</Header>
                <List>
                  {projectData
                    .filter(project => project.ProjectStatus === currentStatusType)
                    .map(project => (
                      <List.Item key={project.ProjectID}>{project.ProjectName}</List.Item>
                    ))}
                </List>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>

      </div> 
    </Container> 
  );
};

export default Dashboard;
