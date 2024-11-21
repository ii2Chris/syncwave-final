import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Signup from '../../components/signup';
const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from the Express API
    axios.get('http://localhost:5000/api')
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error(error));
  }, []);

  return (
   <>
   <Signup></Signup>
   </>
  );
};

export default App;
