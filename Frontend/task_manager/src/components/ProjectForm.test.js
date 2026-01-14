import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { ProjectContext } from "../controllers/ProjectContext";
import { BrowserRouter as Router } from 'react-router-dom';
import { currentAuthenticatedUser } from "../controllers/config";
import ProjectForm from "./ProjectForm";
jest.mock("../controllers/projectops", () => ({
  addproject: jest.fn().mockResolvedValue([{ Project_Id: "123" }]),
}));
const mockAddProjectToList = jest.fn();
const mockCurrentAuthenticatedUser = jest.fn();
const mockProjectContextValue = {
  addProjectToList: mockAddProjectToList,
};
beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentAuthenticatedUser.mockResolvedValue({
    username: "testuser",
    userId: "testuserid",
    signInDetails: { loginId: "test@example.com" },
  });
});
describe("ProjectForm Component", () => {
  it("should render project form fields and submit button", () => {
    render(
    <Router>
      <ProjectContext.Provider value={mockProjectContextValue}>
        <ProjectForm />
      </ProjectContext.Provider>
    </Router>
    );
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByText("Create Project")).toBeInTheDocument();
  });
});