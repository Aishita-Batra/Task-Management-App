import boto3
import json
from moto import mock_aws
import pytest
from unittest.mock import MagicMock, patch, ANY

from tasks import create_task, send_email_to_assignee, get_tasks, read_task, update_task, send_email_to_creator, delete_task

dynamodb_table_name='projects'

# Mock DynamoDB table
@pytest.fixture
def dynamodb_mock():
    with mock_aws():
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName=dynamodb_table_name,
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'}
            ],
       ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        table.meta.client.get_waiter('table_exists').wait(TableName=dynamodb_table_name)
        yield dynamodb

# Test the create_task function
@mock_aws
def test_create_task(dynamodb_mock):
    project_id = 123 
    event = {
        'requestContext':{'authorizer':{'claims':{'email':'ishizgup@amazon.com'}}},
        'pathParameters': {'project_id': project_id},
        'body': json.dumps({
            'task_name': 'Test Task',
            'task_due_date': '2023-05-01',
            'task_creator_email': 'creator@example.com',
            'task_assignee_email': 'assignee@example.com',
            'task_status': 'Complete',
            'task_priority': 'High'
        })
    }

    # Call the create_task function
    response = create_task(event)

    # Assert the response
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    # assert len(body) == 1
    assert 'Task_id' in body[0]

    # Get the DynamoDB table resource
    table_name = dynamodb_table_name 
    table = dynamodb_mock.Table(table_name)

    # Verify the item in the DynamoDB table
    partition_key = f"Project#{project_id}"
    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(partition_key)
    )
    assert len(response['Items']) == 1
    item = response['Items'][0]
    assert item['Task_Name'] == 'Test Task'
    assert item['Task_Due_Date'] == '2023-05-01'
    assert item['Task_Creator_Email'] == 'creator@example.com'
    assert item['Task_Assignee_Email'] == 'assignee@example.com'
    assert item['Task_Status'] == 'Complete'
    assert item['Task_Priority'] == 'High'

# Test cases for create_task function
@mock_aws
def test_create_task_empty_task_name(dynamodb_mock):
    project_id = 123  
    event = {
        'requestContext':{'authorizer':{'claims':{'email':'ishizgup@amazon.com'}}},
        'pathParameters': {'project_id': project_id},
        'body': json.dumps({
            'task_name': '',  
            'task_due_date': '2025-05-01',
            'task_creator_email': 'ybarnwal@amazon.com',
            'task_assignee_email': 'assignee@example.com',
            'task_status': 'Complete',
            'task_priority': 'High'
        })
    }

    response = create_task(event)
    assert response['statusCode'] == 500  # Expected error response

    # Assert the error message or any other expected behavior
    body = json.loads(response['body'])
    assert 'error' in body

# Test the send_email_to_assignee function
@mock_aws
def test_send_email_to_assignee():
    sender_email="ishizgup@amazon.com"
    recipient_email = "assignee@example.com"
    task_id = 1
    task_name = "Test Task"

    # Mock the boto3.client function
    with patch('boto3.client') as mock_client:
        # Create a custom mocked SES client
        mocked_ses_client = MagicMock()
        mock_client.return_value = mocked_ses_client

        # Call the send_email_to_assignee function
        send_email_to_assignee(sender_email,recipient_email, task_id, task_name)

        # Verify that the send_email method was called with the expected arguments
        expected_destination = {
            'ToAddresses': [recipient_email]
        }
        expected_message = {
            'Body': {
                'Html': {
                    'Charset': 'UTF-8',
                    'Data': ANY 
                },
                'Text': {
                    'Charset': 'UTF-8',
                    'Data': f'You have been assigned a new task: {task_name}'
                }
            },
            'Subject': {
                'Charset': 'UTF-8',
                'Data': f'New Task Assigned: {task_name}'
            }
        }
        expected_source = 'ishizgup@amazon.com'

        mocked_ses_client.send_email.assert_called_once_with(
            Destination=expected_destination,
            Message=expected_message,
            Source=expected_source
        )


# Test the get_tasks function with no tasks
@mock_aws
def test_get_tasks_with_no_tasks(dynamodb_mock):
    project_id = 123
    event = {
        'pathParameters': {'project_id': project_id}
    }

    # Call the get_tasks function
    response = get_tasks(event)

    # Assert the response
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert len(body) == 0

# Test the get_tasks function with multiple tasks
@mock_aws
def test_get_tasks_with_multiple_tasks(dynamodb_mock):
    project_id = '123'
    partition_key = f'Project#{project_id}'

    # Get the DynamoDB table resource
    table_name = dynamodb_table_name
    table = dynamodb_mock.Table(table_name)

    # Create sample tasks in the DynamoDB table
    table.put_item(Item={
        'PK': partition_key,
        'SK': 'Task#01',
        'Task_ID': '01',
        'Task_Name': 'Task 1',
        'Task_Due_Date': '2023-05-01',
        'Task_Creator_Email': 'ybarnwal@amazon.com',
        'Task_Assignee_Email': 'assignee@example.com',
        'Task_Status': 'In Progress',
        'Task_Priority': 'High'
    })
    table.put_item(Item={
        'PK': partition_key,
        'SK': 'Task#02',
        'Task_ID': '02',
        'Task_Name': 'Task 2',
        'Task_Due_Date': '2023-05-15',
        'Task_Creator_Email': 'ybarnwal@amazon.com',
        'Task_Assignee_Email': 'assignee@example.com',
        'Task_Status': 'Completed',
        'Task_Priority': 'Low'
    })

    # Invoke the Lambda function
    event = {'pathParameters': {'project_id': project_id}}
    response = get_tasks(event)

    # Assert the response
    assert response['statusCode'] == 200
    tasks = json.loads(response['body'])
    assert len(tasks) == 2

# Test case for missing task_id
def test_get_tasks_missing_task_id():
    event = {}
    response = get_tasks(event)

    assert response['statusCode'] == 404
    error_message = json.loads(response['body'])
    assert error_message['error'] == 'Invalid request: task_id is missing'

# Test the read_task function
def test_read_task(dynamodb_mock):
    project_id = '123'  
    task_id = '1'  
    task = {
        'Task_Id': task_id,
        'Task_Name': 'Test Task',
        'Task_Due_Date': '2023-05-01',
        'Task_Creator_Email': 'creator@example.com',
        'Task_Assignee_Email': 'assignee@example.com',
        'Task_Status': 'Complete',
        'Task_Priority': 'High'
    }

    # Get the DynamoDB table resource
    table = dynamodb_mock.Table(dynamodb_table_name)

    # Add the task to the DynamoDB table
    partition_key = f"Project#{project_id}"
    sort_key = f"Task#{task_id}"
    table.put_item(
        Item={
            'PK': partition_key,
            'SK': sort_key,
            'Task_ID': task['Task_Id'],
            'Task_Name': task['Task_Name'],
            'Task_Due_Date': task['Task_Due_Date'],
            'Task_Creator_Email': task['Task_Creator_Email'],
            'Task_Assignee_Email': task['Task_Assignee_Email'],
            'Task_Status': task['Task_Status'],
            'Task_Priority': task['Task_Priority']
        }
    )

    event = {
        'pathParameters': {
            'project_id': project_id,
            'task_id': task_id
        }
    }

    # Call the read_task function
    response = read_task(event)  

    # Assert the response
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert len(body) == 1
    retrieved_task = body[0]
    assert retrieved_task == {
        'Task_ID': task['Task_Id'],
        'Task_Name': task['Task_Name'],
        'Task_Due_Date': task['Task_Due_Date'],
        'Task_Creator_Email': task['Task_Creator_Email'],
        'Task_Assignee_Email': task['Task_Assignee_Email'],
        'Task_Status': task['Task_Status'],
        'Task_Priority': task['Task_Priority']
    }

# Test the case where task_id is missing
def test_read_task_missing_task_id(dynamodb_mock):
    project_id = '123'
    event = {
        'pathParameters': {
            'project_id': project_id
        }
    }

    response = read_task(event)

    assert response['statusCode'] == 404
    body = json.loads(response['body'])
    assert body['error'] == 'Invalid request: task_id is missing'

# Test the update_task function
def test_update_task(dynamodb_mock):
    project_id = '123'
    task_id = '1'
    task = {
        'Task_Id': task_id,
        'Task_Name': 'Test Task',
        'Task_Due_Date': '2023-05-01',
        'Task_Creator_Email': 'ybarnwal@amazon.com',
        'Task_Assignee_Email': 'assignee@example.com',
        'Task_Status': 'Complete',
        'Task_Priority': 'High'
    }

    # Get the DynamoDB table resource
    table = dynamodb_mock.Table(dynamodb_table_name)

    # Add the task to the DynamoDB table
    partition_key = f"Project#{project_id}"
    sort_key = f"Task#{task_id}"
    table.put_item(
        Item={
            'PK': partition_key,
            'SK': sort_key,
            'Task_ID': task['Task_Id'],
            'Task_Name': task['Task_Name'],
            'Task_Due_Date': task['Task_Due_Date'],
            'Task_Creator_Email': task['Task_Creator_Email'],
            'Task_Assignee_Email': task['Task_Assignee_Email'],
            'Task_Status': task['Task_Status'],
            'Task_Priority': task['Task_Priority']
        }
    )

    event = {
        'requestContext':{'authorizer':{'claims':{'email':'ishizgup@amazon.com'}}},
        'pathParameters': {
            'project_id': project_id,
            'task_id': task_id
        },
        'body': json.dumps({
            'Updates': {'Task_Status': 'Complete', 'Task_Priority': 'Low'},
            'Task_Name': task['Task_Name'],
            'Task_Creator_Email': task['Task_Creator_Email']
        })
    }

    # Call the update_task function
    response = update_task(event)

    # Assert the response
    assert response['statusCode'] == 200

# Test the send_email_to_creator function
@mock_aws
def test_send_email_to_creator():
    sender_email="ishizgup@amazon.com"
    recipient_email = "creator@example.com"
    task_id = 1
    task_name = "Test Task"

    # Mock the boto3.client function
    with patch('boto3.client') as mock_client:
        # Create a custom mocked SES client
        mocked_ses_client = MagicMock()
        mock_client.return_value = mocked_ses_client

        # Call the send_email_to_creator function
        send_email_to_creator(sender_email,recipient_email, task_id, task_name)

        # Verify that the send_email method was called with the expected arguments
        expected_destination = {
            'ToAddresses': [recipient_email]
        }
        expected_message = {
            'Body': {
                'Html': {
                    'Charset': 'UTF-8',
                    'Data': ANY
                },
                'Text': {
                    'Charset': 'UTF-8',
                    'Data': f'The Task-{task_name} assigned has been completed'
                }
            },
            'Subject': {
                'Charset': 'UTF-8',
                'Data': f'Task Completed: {task_name}'
            }
        }
        expected_source = 'ishizgup@amazon.com'

        mocked_ses_client.send_email.assert_called_once_with(
            Destination=expected_destination,
            Message=expected_message,
            Source=expected_source
        )

# Test the delete_task function
def test_delete_task(dynamodb_mock):
    project_id = '123'  
    task_id = '2'  
    task = {
        'Task_ID': task_id,
        'Task_Name': 'Test Task',
        'Task_Due_Date': '2023-05-01',
        'Task_Creator_Email': 'ybarnwal@amazon.com',
        'Task_Assignee_Email': 'assignee@example.com',
        'Task_Status': 'Complete',
        'Task_Priority': 'High'
    }

    # Get the DynamoDB table resource
    table = dynamodb_mock.Table(dynamodb_table_name)

    # Add the task to the DynamoDB table
    partition_key = f"Project#{project_id}"
    sort_key = f"Task#{task_id}"
    table.put_item(
        Item={
            'PK': partition_key,
            'SK': sort_key,
            'Task_ID': task['Task_ID'],
            'Task_Name': task['Task_Name'],
            'Task_Due_Date': task['Task_Due_Date'],
            'Task_Creator_Email': task['Task_Creator_Email'],
            'Task_Assignee_Email': task['Task_Assignee_Email'],
            'Task_Status': task['Task_Status'],
            'Task_Priority': task['Task_Priority']
        }
    )

    event = {
        'pathParameters': {
            'project_id': project_id,
            'task_id': task_id
        }
    }

    # Call the delete_task function
    response = delete_task(event) 

    # Assert the response
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['Attributes']['Task_ID'] == task_id