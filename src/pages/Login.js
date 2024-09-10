import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Message, Segment, Header } from 'semantic-ui-react';
import './Login.css'; // Ensure the CSS file is correctly imported
import logo from '../assets/images/logo.png'; // Import the logo image

const Login = ({ setUserRole }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (loginId === 'leader' && password === 'password') {
     
      setUserRole('leader');
      navigate('/dashboard');
    } else if (loginId === 'bizops' && password === 'password') {
      setUserRole('bizops');
      navigate('/dashboardbizops');
    } else {
      setError('Invalid login credentials. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <Segment className="login-container">
        <img src={logo} alt="Logo" className="login-logo" /> {/* Use the logo image */}
        <Header className="login-signin" as="h2" textAlign="center">
          Sign in
        </Header>
       
        <Form className="login-form">
          <Form.Input
            fluid
            placeholder="Login ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <Form.Input
            fluid
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <a href="/" className="login-forgot-password-link">
            Forgot your password?
          </a>
          {error && <Message className="login-error-message" negative>{error}</Message>}
          <Button className="login-button" color="blue" fluid size="large" onClick={handleLogin}>
            Sign in
          </Button>
        </Form>
      </Segment>
    </div>
  );
};

export default Login;
