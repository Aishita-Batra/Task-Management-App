import json
import boto3

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('projects')  
header={
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type':'application/json'
    }

def lambda_handler(event, context):
    project_id = event['pathParameters']['project_id']
    http_method=event['httpMethod']
    path=event['path']
    print(event)
    
    add_team_member_path=f"/projects/{project_id}/members"
    display_members_path=f"/projects/{project_id}/members"
    remove_team_member_path=f"/projects/{project_id}/members"
    
    if http_method=="POST" and path==add_team_member_path:
        return add_team_member(event)
    elif http_method=="GET" and path==display_members_path:
        return get_team_members(event)
    elif http_method=="PUT" and path==remove_team_member_path:
        return remove2_team_member(event)
    else:
        return{
            'statusCode':400,
            'headers':header,
            'body':json.dumps("Unsupported method or path")
        }
        

def add_team_member(event):
    project_id = event['pathParameters']['project_id']
    body=json.loads(event['body'])
    
    if 'full_name' not in body  or 'email_id' not in body:
            return{
                'statusCode': 400,
                'headers':header,
                'body': json.dumps("Body parameters are missing")
            }
    
    team_member_name=body['full_name']
    team_member_email=body['email_id']
    
    partition_key_user= "User"
    sort_key_user=f"#{team_member_email}"

    try:
        response2=table.get_item(
            Key={
            'PK':partition_key_user,
            'SK':sort_key_user
            })
            
        if 'Item' not in response2:
            return{
                'statusCode': 404,
                'headers':header,
                'body':json.dumps("User not found")
            }
        

    except Exception as e:
        return{
            'statusCode': 500,
            'headers': header,
            'body':json.dumps(f"An error occurred {str(e)}")
        }
    
    
    #Constructing Keys
    partition_key=f"Project#{project_id}"
    sort_key=f"TeamMember#{team_member_email}"
  
    try:
            
        #check if team member already exists
        response=table.get_item(
            Key={
                'PK':partition_key,
                'SK':sort_key
            }
        )
        
        if 'Item' in response:
            return{
                'statusCode':409,
                'headers':header,
                'body':json.dumps(f"Team member with email {team_member_email} already exists in project {project_id}")
            }
            
        table.put_item(
            Item={
                'PK': partition_key,
                'SK': sort_key,
                'Team_Member_Email': team_member_email,
                'Team_Member_Name': team_member_name
            }
        )
        table.put_item(
            Item={
                'PK':f'User#{team_member_email}',
                'SK':f'Project#{project_id}',
                'Project_Id':project_id
            }
        )    
        return{
            'statusCode':200,
            'headers':header,
            'body':json.dumps('Team member added successfully')
        }
         
    except Exception as e:
        
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occurred : {str(e)}")
        }
    
def get_team_members(event):
    project_id=event['pathParameters']['project_id']
    partition_key=f"Project#{project_id}"
    
   
    try:
        response = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(partition_key) & boto3.dynamodb.conditions.Key('SK').begins_with('TeamMember#'))
        
        team_members=[]
        for item in response['Items']:
            team_member_email=item['Team_Member_Email']
            team_member_name=item['Team_Member_Name']
            team_members.append({
                'email': team_member_email,
                'name': team_member_name
            })
        
        if not team_members:
            return{
                'statusCode':404,
                'headers':header,
                'body': json.dumps("No team member found")
            }
 
        return{
            'statusCode': 200,
            'headers':header,
            'body': json.dumps(team_members)
        }
        
    except Exception as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occured: {str(e)}")
        }
        
def remove2_team_member(event) :
    project_id=event['pathParameters']['project_id']
    body=json.loads(event['body'])
    
    if 'email_id' not in body:
            return{
                'statusCode': 400,
                'headers':header,
                'body': json.dumps("Body parameters are missing")
            }
            
    email_id_to_remove=body['email_id']
    #Construction Keys
    partition_key=f"Project#{project_id}"
    sort_key=f"TeamMember#{email_id_to_remove}"
 
    try:
        
        response=table.get_item(
            Key={
                'PK':partition_key,
                'SK':sort_key
            }
        )
        
        if 'Item' not in response:
            return{
                'statusCode':404,
                'headers':header,
                'body':json.dumps(f"Team member with email {email_id_to_remove} does not exist in the project {project_id}")
            }
            
        response=table.delete_item(
            Key={
                'PK':partition_key,
                'SK':sort_key
            }
        )
        res=table.delete_item(
            Key={
                'PK':f'User#{email_id_to_remove}',
                'SK':f'Project#{project_id}'
            }
        )
        return{
            'statusCode':200,
            'headers':header,
            'body':json.dumps(f"Team member with email {email_id_to_remove} removed successfully")
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers':header,
            'body': json.dumps(f"An error occurred : {str(e)}")
        }

    