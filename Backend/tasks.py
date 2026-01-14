import json
import boto3
import uuid
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

client = boto3.client("dynamodb")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("projects")

header={
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type':'application/json'
    }

def lambda_handler(event, context):
    
    print(event)
    
    http_method = event['httpMethod']
    path = event['path']
    project_id = event['pathParameters']['project_id']
    
    print(project_id)
    
    if 'task_id' in event['pathParameters']:
        task_id = event['pathParameters']['task_id']
    else:
        task_id = None
    
    print('event:', event)
    
    
    # API Endpoint Routing
    if http_method == 'POST' and path == f'/projects/{project_id}/tasks':
        return create_task(event)
    elif http_method == 'GET' and path == f'/projects/{project_id}/tasks':
        return get_tasks(event)
    elif http_method == 'GET' and path == f'/projects/{project_id}/tasks/{task_id}':
        return read_task(event)
    elif http_method == 'PUT' and path == f'/projects/{project_id}/tasks/{task_id}':
        return update_task(event)
    elif http_method == 'DELETE' and path == f'/projects/{project_id}/tasks/{task_id}':
        return delete_task(event)
    else:
        return {
            'statusCode': 404,
            'headers':header,
            'body': json.dumps('Invalid endpoint')
        }



# Create a task

def create_task(event):
    try:
        
        body=json.loads(event['body'])

        #Generating uuid for task_id
        project_id = event['pathParameters']['project_id']
        task_id = str(uuid.uuid4())
        
        # Create the partition key and sort key
        partition_key = f"Project#{project_id}"
        sort_key = f"Task#{task_id}"
        
        body = json.loads(event['body'])
        Task_Name=body['task_name']

        if not Task_Name:
            return {
                'statusCode': 500,
                'headers':header,
                'body': json.dumps({'error': 'Task Name cannot be empty'})
            }

        # Add the item to the table
        response = table.put_item(
            Item={
                'PK': partition_key,
                'SK': sort_key,
                'Task_ID': task_id,
                'Task_Name': body['task_name'],
                'Task_Due_Date': body['task_due_date'],
                'Task_Creator_Email': body['task_creator_email'],
                'Task_Assignee_Email': body['task_assignee_email'],
                'Task_Status': body['task_status'],
                'Task_Priority': body['task_priority'],
            }
        )
        # Send email to the assigned user
        user_email=event['requestContext']['authorizer']['claims']['email']
        send_email_to_assignee(user_email,body['task_assignee_email'], task_id, body['task_name'])


        responseBody=[{
            'Task_id':task_id
        }]
        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(responseBody)
        }
        
    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }

def send_email_to_assignee(sender_email,recipient_email, task_id, task_name):
  

    SENDER = sender_email
    RECIPIENT = recipient_email
    AWS_REGION = "us-east-1"

    # The subject line for the email.
    SUBJECT = f"New Task Assigned: {task_name}"

    # The email body for recipients with non-HTML email clients.
    BODY_TEXT = f"You have been assigned a new task: {task_name}"

    # The HTML body of the email.
    BODY_HTML = f"""<html>
    <head></head>
    <body>
    <h1>New Task Assigned</h1>
    <p>You have been assigned a new task:</p>
    <p><strong>Task Name:</strong> {task_name}</p>
    </body>
    </html>
    """

    # Create a new SES resource and specify a region.
    ses_client = boto3.client('ses', region_name=AWS_REGION)

    # Try to send the email.
    try:
        # Provide the contents of the email.
        response = ses_client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': "UTF-8",
                        'Data': BODY_HTML,
                    },
                    'Text': {
                        'Charset': "UTF-8",
                        'Data': BODY_TEXT,
                    },
                },
                'Subject': {
                    'Charset': "UTF-8",
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
        )
        
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])


#Retrieve all Tasks

def get_tasks(event):

    try:
        project_id=event['pathParameters']['project_id']
        print(project_id)
        
        partition_key = f'Project#{project_id}'

        # Query the table to get all tasks for the project
        response = table.query(
            KeyConditionExpression=Key('PK').eq(partition_key) & Key('SK').begins_with('Task#')
        )

        # Extract the relevant attributes from the Items
        
        tasks = response.get('Items',[])
        items = [
            {
                'Task_ID': task['Task_ID'],
                'Task_Name': task['Task_Name'],
                'Task_Due_Date': task['Task_Due_Date'],
                'Task_Creator_Email': task['Task_Creator_Email'],
                'Task_Assignee_Email': task['Task_Assignee_Email'],
                'Task_Status': task['Task_Status'],
                'Task_Priority': task['Task_Priority']
            }
            for task in tasks
        ]

        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(items)
        }

    except KeyError as e:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Invalid request: task_id is missing'})
        }
        
    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }


# Retrieve a particular Task

def read_task(event):

    try:
        project_id = event['pathParameters']['project_id']
        task_id = event['pathParameters']['task_id']

        # Create the partition key and sort key
        partition_key = f'Project#{project_id}'
        sort_key = f'Task#{task_id}'
        
        # Query the table to get all tasks for the project
        response = table.query(
            KeyConditionExpression=Key('PK').eq(partition_key) & Key('SK').eq(sort_key)
        )

        # Extract the relevant attributes from the Items
        
        tasks = response.get('Items',[])
        
        items = [
            {
                'Task_ID': task['Task_ID'],
                'Task_Name': task['Task_Name'],
                'Task_Due_Date': task['Task_Due_Date'],
                'Task_Creator_Email': task['Task_Creator_Email'],
                'Task_Assignee_Email': task['Task_Assignee_Email'],
                'Task_Status': task['Task_Status'],
                'Task_Priority': task['Task_Priority']
            }
            for task in tasks
        ]
        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(items)
        }

    except KeyError as e:
        # Handle the case where the 'task_id' key is not present in the event
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Invalid request: task_id is missing'})
        }

    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }

# Updating a Task

def update_task(event):

    try:
        # Get the project_id from the event
        body=json.loads(event['body'])
        print (body)
        updates=body['Updates']
        print(updates)
        
        task_name=body['Task_Name']
        task_creator_email=body['Task_Creator_Email']
        
        project_id = event['pathParameters']['project_id']
        task_id = event['pathParameters']['task_id']

        # Create the partition key
        partition_key = f'Project#{project_id}'
        sort_key = f'Task#{task_id}'

        
        # Update Table Attributes
        response = table.update_item(
            Key={
                'PK': partition_key,
                'SK': sort_key
            },
            UpdateExpression='SET '+', '.join([f"{k} = :v{i}" for i, k in enumerate(updates)]),
            # SET Task_Status = :v0, Task_Priority = :v1
            ExpressionAttributeValues={f":v{i}": v for i, v in enumerate(updates.values())},
            # {':v0': 'Pending', ':v1': 'M'}
            ReturnValues="UPDATED_NEW"
        )

        # Retrieve updated attributes
        
        updated_attributes = response.get('Attributes', {})
        user_email=event['requestContext']['authorizer']['claims']['email']
        if 'Task_Status' in body['Updates']:
            if body['Updates']['Task_Status']=="Complete":
        
                # Send email to the assigned user
                send_email_to_creator(user_email,task_creator_email, task_id, task_name)
                
        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(f'{updated_attributes}')
        }

    except KeyError as e:
        # Handle the case where the 'task_id' key is not present in the event
        return {
            'statusCode': 404,
            'headers': header,
            'body': json.dumps({'error': 'Invalid request: task_id is missing'})
        }

    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }

def send_email_to_creator(sender_email,recipient_email, task_id, task_name):
    

    SENDER = sender_email
    RECIPIENT = recipient_email
    AWS_REGION = "us-east-1"

    # The subject line for the email.
    SUBJECT = f"Task Completed: {task_name}"

    # The email body for recipients with non-HTML email clients.
    BODY_TEXT = f"The Task-{task_name} assigned has been completed"

    # The HTML body of the email.
    BODY_HTML = f"""<html>
    <head></head>
    <body>
    <h1>Task Completed</h1>
    <p>Task Completed:</p>
    <p><strong>Task Name:</strong> {task_name}</p>
    </body>
    </html>
    """

    # Create a new SES resource and specify a region.
    client = boto3.client('ses', region_name=AWS_REGION)

    # Try to send the email.
    try:
        # Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': "UTF-8",
                        'Data': BODY_HTML,
                    },
                    'Text': {
                        'Charset': "UTF-8",
                        'Data': BODY_TEXT,
                    },
                },
                'Subject': {
                    'Charset': "UTF-8",
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
        )
        
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])



# Deleting a Task

def delete_task(event):

    try:
        project_id = event['pathParameters']['project_id']
        task_id = event['pathParameters']['task_id']

        # Create the partition key
        partition_key = f'Project#{project_id}'
        sort_key = f'Task#{task_id}'     

        # Update Table Attributes
        response = table.delete_item(
            Key={
                'PK': partition_key,
                'SK': sort_key
            },
            ReturnValues = 'ALL_OLD'
        )
        
        deleted_item = response.get("Attributes",{})

        
        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(response)
        }

    except KeyError as e:
        # Handle the case where the 'task_id' key is not present in the event
        return {
            'statusCode': 404,
            'headers': header,
            'body': json.dumps({'error': 'Invalid request: task_id is missing'})
        }
        
    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }
