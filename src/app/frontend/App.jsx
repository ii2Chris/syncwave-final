import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from '../../components/signup';
import ProfilePage from '../../components/ProfilePage';
import Login from '../../components/login'; 
import Dashboard from './pages/dashboard';
import Test from './pages/test';
//import Homepage from './pages/homepage';
import LandingPage from './pages/LandingPage';

//import Chat from './pages/chat';
const App = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path ="/test" element={<Test/>}/>
        <Route path="/profile" element={<ProfilePage />} />
        {/* <Route path ="/landingpage" element={<LandingPage/>}/> */}

       {/* <Route path = "/chat" element={<Chat/>} />*/}
      </Routes>
    </Router>
  );
};

export default App;
