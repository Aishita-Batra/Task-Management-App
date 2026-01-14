import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SideBar from './Sidebar';
import { MemoryRouter } from 'react-router-dom';
import { ProjectContext } from '../controllers/ProjectContext';
jest.mock('../controllers/projectops', () => ({
  getallprojects: jest.fn().mockResolvedValue([
    { Project_Id: 1, Project_Name: 'Project 1' },
    { Project_Id: 2, Project_Name: 'Project 2' },
  ]),
}));
describe('SideBar component', () => {
  const setProjectMock=jest.fn();
  it('displays home and project sections', async () => {
    render(
        <MemoryRouter>
            <ProjectContext.Provider value={{ projects:[] ,setProjects : setProjectMock } }>
                <SideBar/>
            </ProjectContext.Provider>
        </MemoryRouter>
    );
    // Home section
    expect(screen.getByText('Home')).toBeInTheDocument();
    // Project section
    const projectSection = screen.getByText('Project');
    expect(projectSection).toBeInTheDocument();  
  });
});









