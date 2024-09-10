// src/pages/ClientProjects.js

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon } from 'semantic-ui-react';
import './ClientDetails.css';

const ClientProjects = () => {
  const { clientId } = useParams(); // Get the clientId from the URL
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Mock data for projects by client company
  const projectsData = {
    'acme-corp': [
      { name: 'Website Redesign', status: 'In Progress', category: 'Development' },
      { name: 'Mobile App Development', status: 'Completed', category: 'Software' },
    ],
    'global-tech': [
      { name: 'AI Research', status: 'In Progress', category: 'Research' },
      { name: 'Data Migration', status: 'Pending', category: 'Data' },
    ],
    'healthify-inc': [
      { name: 'Health Tracking App', status: 'In Progress', category: 'Healthcare' },
      { name: 'Wellness Portal', status: 'Completed', category: 'Health' },
    ],
    'edupro': [
      { name: 'E-learning Platform', status: 'Pending', category: 'Education' },
      { name: 'Course Management System', status: 'In Progress', category: 'Education' },
    ],
  };

  const clientName = clientId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const projects = projectsData[clientId] || []; // Get projects for the current client

  const handleProjectClick = (projectName) => {
    navigate(`/client/${clientId}/project/${projectName.toLowerCase().replace(/ /g, '-')}`); // Navigate to project details page with clientId and projectId
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
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
              onClick={() => handleProjectClick(project.name)}
              style={{ cursor: 'pointer' }}
            >
              <Table.Cell>
                <Icon name="folder" /> {project.name}
              </Table.Cell>
              <Table.Cell>{project.status}</Table.Cell>
              <Table.Cell>{project.category}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ClientProjects;
