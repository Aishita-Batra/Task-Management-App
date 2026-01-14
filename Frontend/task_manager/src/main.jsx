import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App.jsx";
import { Amplify } from "aws-amplify";
import "bootstrap/dist/css/bootstrap.min.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <App/>
);
