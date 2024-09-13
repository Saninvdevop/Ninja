import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Keep using BrowserRouter
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Login from './pages/Login';
import DashboardBizOps from './pages/DashboardBizOps';
import Unallocated from './pages/Unallocated';
import EmployeeDetails from './pages/EmployeeDetails';
import ClientProjects from './pages/ClientProjects';
import ClientDetails from './pages/ClientDetails'; // Import ClientDetails
import ToDoPage from './pages/ToDoPage';
import Reports from './pages/Reports';
import EmpPage from './pages/EmpPage'; // Import the new page

const App = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole')); // Initialize state from localStorage

  useEffect(() => {
    // Whenever userRole changes, save it to localStorage
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [userRole]);

  const handleLogout = () => {
    setUserRole(null); // Clear user role
    localStorage.removeItem('userRole'); // Remove user role from localStorage
  };

  return (
    <Router>
      {!userRole ? (
        <Routes>
          <Route path="/" element={<Login setUserRole={setUserRole} />} /> {/* Pass setUserRole to Login */}
        </Routes>
      ) : (
        <>
          {/* Pass userRole and setUserRole to Navbar for conditional rendering */}
          <Navbar userRole={userRole} setUserRole={handleLogout} /> {/* Pass handleLogout to Navbar */}
          <div style={{ marginLeft: '220px', padding: '20px', width: '100%' }}>
            <Routes>
              {userRole === 'leader' && (
                <>
                  {/* Routes specific to the leader role */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/reports" element={<Reports userRole={userRole} />} />
                </>
              )}
              {userRole === 'bizops' && (
                <>
                  {/* Routes specific to the bizops role */}
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/dashboardbizops" element={<DashboardBizOps />} />
                  <Route path="/unallocated" element={<Unallocated />} />
                  <Route path="/todo" element={<ToDoPage />} />
                  <Route path="/employees" element={<EmpPage />} /> {/* Updated route to /employees */}
                  <Route path="/reports" element={<Reports userRole={userRole} />} />
                </>
              )}
              {/* Common Routes for both roles */}
              <Route path="/employee/:id" element={<EmployeeDetails userRole={userRole} />} />
              <Route path="/client/:clientId/projects" element={<ClientProjects />} />
              <Route path="/client/:clientId/project/:projectId" element={<ClientDetails userRole={userRole} />} /> {/* Pass userRole to ClientDetails */}
            </Routes>
          </div>
        </>
      )}
    </Router>
  );
};

export default App;
