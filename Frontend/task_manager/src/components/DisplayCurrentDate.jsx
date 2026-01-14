import React, { useState, useEffect } from 'react';
import { Container} from 'react-bootstrap';

function DisplayCurrentDate() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date()); 
    }, 86400000); // Update every 24 hours (86400000 milliseconds)

    return () => clearInterval(interval);
  }, []);

  const day = String(currentDate.getDate()).padStart(2, '0'); //get day from currentDate and ensure that it is a 2 digit number
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');//get month  
  const year = String(currentDate.getFullYear()).slice(2); //slice return last 2 digits of year

  return (
    <Container>
          <h1 className="text-center font-weight-bold date" >
            {day}-{month}-{year}
          </h1>
    </Container>
  );
}

export default DisplayCurrentDate;