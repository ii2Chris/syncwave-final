import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from '../../components/signup';
import Login from '../../components/login'; 
import Dashboard from './pages/dashboard';
import Test from './pages/test';
//import Homepage from './pages/homepage';
//import LandingPage from './pages/landingpage';

//import Chat from './pages/chat';
const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path = "/" element = {<Homepage/>}/> */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path ="/test" element={<Test/>}/>
        {/* <Route path ="/landingpage" element={<LandingPage/>}/> */}

       {/* <Route path = "/chat" element={<Chat/>} />*/}
      </Routes>
    </Router>
  );
};

export default App;
