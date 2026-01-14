import React from "react";
import DisplayCurrentDate from "./DisplayCurrentDate";

const MainContent = () => {
  return (
    <div>
        <br />
        <DisplayCurrentDate />
        <br />
        <div className="text-center font-weight-bold content">
          Greetings, Welcome to Task Manager!
        </div>
      </div>
  );
};

export default MainContent;
