import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'semantic-ui-react';

const Unallocated = () => {
  const navigate = useNavigate();

  const employeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', current_allocation: 50 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', current_allocation: 30 },
    { employee_id: 'E003', employee_name: 'John Johnson', email: 'j.johnson@example.com', current_allocation: 20 },
    { employee_id: 'E004', employee_name: 'Peter Smith', email: 'p.smith@example.com', current_allocation: 30 },
    { employee_id: 'E005', employee_name: 'Sam Johnson', email: 's.johnson@example.com', current_allocation: 10 },
    { employee_id: 'E006', employee_name: 'Ron Smith', email: 'r.smith@example.com', current_allocation: 90 },
    { employee_id: 'E007', employee_name: 'Parker Johnson', email: 'p.johnson@example.com', current_allocation: 55 },
    { employee_id: 'E008', employee_name: 'Samuel Smith', email: 'sm.smith@example.com', current_allocation: 30 },
    // Add more employee data here
  ];

  const handleEmployeeClick = (employee) => {
    // Navigate to EmployeeDetails with the allocation percentage and other data
    navigate(`/employee/${employee.employee_id}`, {
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
          {employeeData.map((employee) => (
            <Table.Row key={employee.employee_id} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
              <Table.Cell>{employee.employee_id}</Table.Cell>
              <Table.Cell>{employee.employee_name}</Table.Cell>
              <Table.Cell>{employee.email}</Table.Cell>
              <Table.Cell>{employee.current_allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default Unallocated;
