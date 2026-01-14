import React, {createContext , useState, useEffect} from 'react';
import { getallprojects } from './projectops';

export const ProjectContext=createContext();

export const ProjectProvider=({children})=>
{
    const [projects,setProjects]=useState([]); //set projects array
    //function to add new project to list
    const addProjectToList=(project_id,name,description,ownerEmail)=>{
        const newProject={
            Project_Id:project_id,
            Project_Name:name,
            Project_Description:description,
            Project_Owner_Email:ownerEmail
        }
        setProjects([...projects,newProject]); //...projects depicts already present projects, add newProject
    }
    //remove project with specefic project_id from list
    const removeProjectfromList=(project_id)=>{
        setProjects(l => l.filter(item => item.Project_Id !== project_id));
    }
    //fetch all projects from api call and add in context array
    const fetchProjects=async()=>{
        const projectList=await getallprojects(); //api call
        setProjects(projectList);
    }
    //get a particular project from context
    const getProjectfromList=async(project_id)=>{
        if(!projects.length)
        {   //if on reload project list is empty, api call to get details of all projects
            const projectList = await getallprojects();
            // console.log(projectList);
            if(projectList.length==0)
            {
                return null;
            }
            const project= projectList.find((project)=>project.Project_Id===project_id);
            // console.log(project);
            return project;
        }
        const project= projects.find((project)=>project.Project_Id===project_id);
        return project;
    }

    useEffect(()=>{
        fetchProjects();
    },[])

    return(
        <ProjectContext.Provider value={{projects,fetchProjects,addProjectToList,setProjects,removeProjectfromList,getProjectfromList}}>
            {children}
        </ProjectContext.Provider>
    )
}