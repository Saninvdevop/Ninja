// src/pages/ProjectEmployees.js
import React from 'react';
import { useParams } from 'react-router-dom';
import { Table, Icon } from 'semantic-ui-react';
import './ClientDetails.css'; // Reuse the same styling

const ProjectEmployees = () => {
  const { clientId, projectId } = useParams(); // Get the clientId and projectId from the URL

  // Mock data for employees by project
  const employeesData = {
    'website-redesign': [
      { name: 'John Doe', role: 'Developer', status: 'Active' },
      { name: 'Jane Smith', role: 'Designer', status: 'Active' },
    ],
    'mobile-app-development': [
      { name: 'Alice Johnson', role: 'Project Manager', status: 'On Leave' },
      { name: 'Bob Brown', role: 'QA Engineer', status: 'Active' },
    ],
    'health-tracking-app': [
      { name: 'Chris Lee', role: 'Backend Developer', status: 'Active' },
      { name: 'Nancy White', role: 'Frontend Developer', status: 'Active' },
    ],
    'e-learning-platform': [
      { name: 'Tom Harris', role: 'Content Writer', status: 'Active' },
      { name: 'Emma Wilson', role: 'Course Developer', status: 'Active' },
    ],
  };

  const projectName = projectId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const employees = employeesData[projectId] || []; // Get employees for the current project

  return (
    <div className="client-details-container">
      <h2>Resources for {projectName}</h2>
      <Table celled padded className="employee-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee Nambe</Table.HeaderCell>
            <Table.HeaderCell>Roltte</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {employees.map((employee, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Icon name="user" /> {employee.name}
              </Table.Cell>
              <Table.Cell>{employee.role}</Table.Cell>
              <Table.Cell>{employee.status}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ProjectEmployees;
