import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fileController from "../controllers/fileops";
import File from "./File";
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    project_id: "project123",
    task_id: "task456",
  }),
  useLocation: () => ({
    state: { Task_Name: "Test Task" },
  }),
}));
jest.mock("../controllers/fileops", () => ({
  getallfiles: jest.fn().mockResolvedValue([
    { File_Name: "File1.pdf" },
    { File_Name: "File2.docx" },
  ]),
  getFile: jest.fn().mockResolvedValue({
    downloadUrl: "https://example.com/download/File1.pdf",
  }),
}));
describe("File component", () => {
  beforeEach(async () => {
    await act(async () => {
      render(<File />);
      //await screen.findByText("File1.pdf"); // Wait for files to be loaded
    });
  });
  it("renders task name and files correctly", () => {
    expect(screen.getByText("Test Task - Files")).toBeInTheDocument();
    expect(screen.getByText("File1.pdf")).toBeInTheDocument();
    expect(screen.getByText("File2.docx")).toBeInTheDocument();
  });
  it("opens file in new tab when 'View File' button is clicked", async () => {
    const viewFileButtons = screen.queryAllByText("View File");
    fireEvent.click(viewFileButtons[0]);
    expect(fileController.getFile).toHaveBeenCalledWith(
      "project123",
      "task456",
      "File1.pdf"
    );
  });
});








