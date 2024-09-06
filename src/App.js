import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Login from './pages/Login';
import DashboardBizOps from './pages/DashboardBizOps';
import Unallocated from './pages/Unallocated';
import EmployeeDetails from './pages/EmployeeDetails';
import ClientProjects from './pages/ClientProjects';
import ClientDetails from './pages/ClientDetails';

const App = () => {
  const [userRole, setUserRole] = useState(null); // State to manage user role

  return (
    <Router>
      {!userRole ? (
        <Routes>
          <Route path="/" element={<Login setUserRole={setUserRole} />} />
        </Routes>
      ) : (
        <>
          {/* Pass userRole to Navbar for conditional rendering */}
          <Navbar userRole={userRole} />
          <div style={{ marginLeft: '220px', padding: '20px', width: '100%' }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/dashboardbizops" element={<DashboardBizOps />} />
              <Route path="/unallocated" element={<Unallocated />} />
              <Route path="/employee/:id" element={<EmployeeDetails />} />
              <Route path="/client/:clientId/projects" element={<ClientProjects />} />
              {/* Pass userRole as a prop to ClientDetails */}
              <Route path="/client/:clientId/project/:projectId" element={<ClientDetails userRole={userRole} />} />
            </Routes>
          </div>
        </>
      )}
    </Router>
  );
};

export default App;
