import json
import boto3
import uuid
from boto3.dynamodb.conditions import Key
from datetime import datetime

client = boto3.resource('dynamodb')
table = client.Table('projects')
header={
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type':'application/json'
    }
def lambda_handler(event, context):
    print('event:',event)
    # resource=event['resource']
    path=event['path']
    method=event['httpMethod']
    
    if event['body']!=None:
        body_json=json.loads(event['body'])
        
    user_email=event['requestContext']['authorizer']['claims']['email']
        
    if not user_email:
        return {
        'statusCode': 400,
        'headers':header,
        'body': json.dumps('User ID is required')
        }
        
    if event['pathParameters']!=None:
        project_id=event['pathParameters']['project_id']

    
    if(path=="/projects" and method=="POST"):
        response=addproject(user_email,body_json)
    
    elif(path=="/projects" and method=="GET"):
        response=getallprojects(user_email)
    
    elif(path==f'/projects/{project_id}' and method=="GET"):
        response=getproject(user_email,project_id)
    
    elif(path==f'/projects/{project_id}' and method=="PUT"):
        response=updateproject(user_email,project_id,body_json['Updates'])
    
    elif(path==f'/projects/{project_id}' and method=="DELETE"):
        response=deleteproject(user_email,project_id)
    else:
        response={
            'statusCode': 404,
            'headers':header,
            'body': json.dumps('Path not found')
            }
    return response    
        
        
#create project
def addproject(user_email,body):
    try:    
        Project_Name=body['Project_Name']
        Project_Owner_Name=body['Project_Owner_Name']
        Project_Desc=body['Project_Desc']
        #create uuid for project id
        p_uuid = str(uuid.uuid4())
        
        #Project Name and Owner name cannot be empty, description can
        if not Project_Name or not Project_Owner_Name:
            return {
                'statusCode': 400,
                'headers':header,
                'body': json.dumps('Project Name and Project Owner Name cannot be empty')
            }
        current_time = datetime.now().isoformat();    
        
        response=table.put_item(
            Item={
                'PK':f"User#{user_email}",
                'SK':f"Project#{p_uuid}",
                'Project_Id':p_uuid
            });
    
        #add item to table
        response=table.put_item(
            Item={
                'PK':f"Project",
                'SK':f"#{p_uuid}",
                'Project_Id':p_uuid,
                'Project_Name': Project_Name,
                'Project_Owner_Email':user_email,
                'Project_Owner_Name': Project_Owner_Name,
                'Project_Description':Project_Desc,
                # 'Creation_Time':current_time
            });
        #add owner as team member    
        response2=table.put_item(
            Item={
                'PK':f"Project#{p_uuid}",
                'SK':f"TeamMember#{user_email}",
                'Team_Member_Email':user_email,
                'Team_Member_Name':Project_Owner_Name
            });  
            
        responseBody = [
                {'Project_Id':p_uuid,
                }]    
        return {
            'statusCode': 200,
            'headers':header,
            'body': json.dumps(responseBody)
        }
        
    except Exception as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occured: {str(e)}")
        }    
       
# get all projects of a user    
def getallprojects(email):    
    try:    
        #get all project ids of user
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'User#{email}') & Key('SK').begins_with('Project'),
            ProjectionExpression='Project_Id'  
        )
        project_ids = [item['Project_Id'] for item in response['Items']]
        
        if len(project_ids)==0:
            return{
            'statusCode': 200,
            'headers':header,
            'body': json.dumps([])
            }
            
        batch_get_response = client.batch_get_item(
            RequestItems={
                'projects': {
                    'Keys': [{'PK': 'Project', 'SK': f"#{project_id}"} for project_id in project_ids]
                }
            }
        )
        print(batch_get_response);  
        while 'UnprocessedItems' in batch_get_response:
            unprocessed_items = batch_get_response['UnprocessedItems']
            if unprocessed_items:
                batch_get_response = client.batch_write_item(
                    RequestItems=unprocessed_items
                )
            else:
                break
                
        # Extract the project data from the response
        projects=[]
        for item in batch_get_response['Responses']['projects']:
            project_id=item['Project_Id']
            project_name=item['Project_Name']
            project_description=item['Project_Description']
            project_owner_email=item['Project_Owner_Email']
            project_owner_name=item['Project_Owner_Name']
            projects.append({
                'Project_Id': project_id,
                'Project_Name': project_name,
                'Project_Description':project_description,
                'Project_Owner_Email':project_owner_email,
                'Project_Owner_Name':project_owner_name
            })
        return{
            'statusCode': 200,
            'headers':header,
            'body': json.dumps(projects)
        }
    except Exception as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occured: {str(e)}")
        }    
        
#get single project having projectId    
def getproject(email,projectId):
    try:
        partition_key="Project"
        sort_key=f"#{projectId}"
        response = table.get_item(
            Key={
                'PK': partition_key,
                'SK': sort_key
            },
            ProjectionExpression=', '.join(['Project_Name', 'Project_Description','Project_Owner_Email','Project_Owner_Name'])
            #comma seperated list of expression: Project_Name, Project_Description, Project_Owner_Email, Project_Owner_Name 
        )
         # Extract the project data from the response, if not found- 404 
        print("get res:",response)
        if "Item" in response:
            project = response["Item"]
            # Return the projects
            return {
                "statusCode": 200,
                'headers':header,
                "body":json.dumps(project),
            }
        else:
            return{
                "statusCode":404,
                'headers':header,
                "body":json.dumps("Project Not Found"),
            }
    except Exception as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occured: {str(e)}")
        }  
        
#update project details
def updateproject(email,projectId,updates):
    try:
         
        #If project does not exists    
        projectdetails=getproject(email,projectId)
        if(projectdetails['statusCode']!=200):
            return{
                'statusCode':404,
                'headers':header,
                'message':json.dumps('Project Not Found')
            } 
        current_time = datetime.now().isoformat();  
        print(current_time)
        updates['Updation_Time']=current_time   
        print(updates);    
        partition_key=f"Project"
        sort_key=f"#{projectId}"
        response = table.update_item(
            Key={
                'PK': partition_key,
                'SK': sort_key
            },
            UpdateExpression='SET '+', '.join([f"{k} = :v{i}" for i, k in enumerate(updates)]),
            # SET Project_Name = :v0, Project_Description = :v1
            ExpressionAttributeValues={f":v{i}": v for i, v in enumerate(updates.values())},
            # {':v0': 'Web App1', ':v1': 'Web App1'}
            ReturnValues="UPDATED_NEW"
        )
        
        return {
                'statusCode': 200,
                'headers':header,
                'body': json.dumps(f"{response["Attributes"]}")
            }
            
    except Exception as e:
            return{
                'statusCode':500,
                'headers':header,
                'body':json.dumps(f"An error occured: {str(e)}")
            }
            
#delete project
def deleteproject(email,projectId):
    try:
        
        #If project does not exists    
        projectdetails=getproject(email,projectId)
        print("delete call", projectdetails)
        if(projectdetails['statusCode']!=200):
            return{
                'statusCode':404,
                'headers':header,
                'body':json.dumps('Project Not Found')
            }
            
        #get all members of this project
        response=table.query(KeyConditionExpression=Key('PK').eq(f'Project#{projectId}') & Key('SK').begins_with(f'TeamMember'))
        team_member_emails = [item['Team_Member_Email'] for item in response['Items']]
        
        keys=[{'PK': f'User#{item}', 'SK': f"Project#{projectId}"} for item in team_member_emails]
        print("key",keys)
        
        batch_delete_response = client.batch_write_item(
            RequestItems={
                'projects': [
                    {
                        'DeleteRequest': {
                            'Key':key
                        }
                    } for key in keys
                ]
            }
        )
        while 'UnprocessedItems' in batch_delete_response:
            unprocessed_items = batch_delete_response['UnprocessedItems']
            if unprocessed_items:
                batch_delete_response = client.batch_write_item(
                    RequestItems=unprocessed_items
                )
            else:
                break
            
        
        #delete project item
        delresponse = table.delete_item(
            Key={
                'PK': "Project",
                'SK': f"#{projectId}"
            },
            ReturnValues="ALL_OLD"
        )
        
        
        #remove all tasks, members and team items
        p_key=f"Project#{projectId}"
        # Query the table to get all items 
        response = table.query(
            KeyConditionExpression=Key('PK').eq(p_key)
        )
        
        keys2=[{'PK': item['PK'], 'SK': item['SK']} for item in response['Items']]
        print("key",keys2)
        
        batch_delete_response2 = client.batch_write_item(
            RequestItems={
                'projects': [
                    {
                        'DeleteRequest': {
                            'Key':key
                        }
                    } for key in keys2
                ]
            }
        )
        
        while 'UnprocessedItems' in batch_delete_response2:
            unprocessed_items = batch_delete_response2['UnprocessedItems']
            if unprocessed_items:
                batch_delete_response2 = client.batch_write_item(
                    RequestItems=unprocessed_items
                )
            else:
                break
        return {
                'statusCode': 200,
                'headers':header,
                'body': json.dumps(f"Project Deleted")
            }
            
    except Exception as e:
            return{
                'statusCode':500,
                'headers':header,
                'body':json.dumps(f"An error occured: {str(e)}")
            }
    
