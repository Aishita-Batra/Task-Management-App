import boto3
import json
from moto import mock_aws
import pytest

from projects import addproject, getallprojects, getproject, deleteproject, updateproject

dynamodb_table_name='projects'
#set up the DynamoDB table
@pytest.fixture
def dynamodb_mock():
    with mock_aws():
        dynamodb = boto3.resource('dynamodb',region_name='us-east-1')
        table=dynamodb.create_table(
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
   
#check if project is added successfully  
@mock_aws
def test_add_project(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    response=addproject(user_email,body)

    assert response['statusCode'] == 200
    body_json=json.loads(response['body'])
    assert 'Project_Id' in body_json[0]

    #check if the project is added to the dynamodb table
    table=dynamodb_mock.Table(dynamodb_table_name)
    project_id=body_json[0]['Project_Id']
    response1=table.get_item(Key={'PK': f'User#{user_email}', 'SK': f'Project#{project_id}'})
    assert 'Item' in response1
    assert response1['Item']['Project_Id'] == project_id

    response2=table.get_item(Key={'PK': f'Project', 'SK': f'#{project_id}'})
    assert 'Item' in response2
    assert response2['Item']['Project_Name'] == 'Test Project'

    response3=table.get_item(Key={'PK': f'Project#{project_id}', 'SK': f'TeamMember#{user_email}'})
    assert 'Item' in response3
    assert response3['Item']['Team_Member_Email'] == user_email
    

#project name cannot be empty
@mock_aws
def test_add_project_missing_name(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name':'',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    response=addproject(user_email, body)
    assert response['statusCode'] == 400

# #owner name cannot be empty
@mock_aws
def test_add_project_missing_owner(dynamodb_mock):
    user_email='XXXXXXXXXXXXXXXXXXX'
    body={
        'Project_Name': 'Test Project',
        'Project_Desc': 'This is a test project',
        'Project_Owner_Name':''
    }
    response=addproject(user_email, body)
    assert response['statusCode'] == 400

# #description empty is allowed
@mock_aws
def test_add_project_missing_description(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita', 
        'Project_Desc':''
    }
    response=addproject(user_email, body)
    assert response['statusCode'] == 200
    body_json=json.loads(response['body'])
    assert 'Project_Id' in body_json[0]

    #check if the project is added to the dynamodb table
    table=dynamodb_mock.Table(dynamodb_table_name)
    project_id=body_json[0]['Project_Id']
    response1=table.get_item(Key={'PK': f'User#{user_email}', 'SK': f'Project#{project_id}'})
    assert 'Item' in response1
    assert response1['Item']['Project_Id'] == project_id

    response2=table.get_item(Key={'PK': f'Project', 'SK': f'#{project_id}'})
    assert 'Item' in response2
    assert response2['Item']['Project_Name'] == 'Test Project'

    response3=table.get_item(Key={'PK': f'Project#{project_id}', 'SK': f'TeamMember#{user_email}'})
    assert 'Item' in response3
    assert response3['Item']['Team_Member_Email'] == user_email

# #if user have 0 projects status=200
@mock_aws
def test_getallprojects(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    response=getallprojects(user_email)
    assert response['statusCode'] == 200
    body_json=json.loads(response['body'])
    assert len(body_json)>=0     

# #add 2 projects and check if getallprojects returns 2 projects
@mock_aws
def test_getallprojects_multiple(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    add_response=addproject(user_email, body)
    project_id=json.loads(add_response['body'])[0]['Project_Id']

    body2={
        'Project_Name': 'Test Project2',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    add_response2=addproject(user_email, body2)
    project_id2=json.loads(add_response2['body'])[0]['Project_Id']

    response=getallprojects(user_email)
    assert response['statusCode'] == 200
    body_json=json.loads(response['body'])
    assert len(body_json)==2


@mock_aws
def test_getproject(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    add_response=addproject(user_email, body)
    project_id=json.loads(add_response['body'])[0]['Project_Id']

    response=getproject(user_email, project_id)    
    assert response['statusCode'] == 200
    body_json=json.loads(response['body'])
    assert body_json['Project_Name'] == 'Test Project'

# #get - project not found
@mock_aws
def test_getproject_notfound(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    response=getproject(user_email, '123')
    print(response)
    assert response['statusCode'] == 404

# #update project - test if any field is empty
@mock_aws
def test_updateproject(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    add_response=addproject(user_email, body)
    project_id=json.loads(add_response['body'])[0]['Project_Id']

    update_body={
        'Project_Name': 'Updated Test Project',
        'Project_Desc': 'This is an updated test project'
    }
    response=updateproject(user_email, project_id, update_body)
    assert response['statusCode'] == 200

    get_response=getproject(user_email, project_id)
    assert get_response['statusCode'] == 200
    body_json=json.loads(get_response['body'])
    assert body_json['Project_Name'] == 'Updated Test Project'

# #update - project not found
@mock_aws
def test_updateproject_notfound(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    update_body={
        'Project_Name': 'Updated Test Project',
        'Project_Desc': 'This is an updated test project'
    }
    response=updateproject(user_email, '123', update_body)
    assert response['statusCode'] == 404

# @mock_aws
def test_deleteproject(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    body={
        'Project_Name': 'Test Project',
        'Project_Owner_Name': 'Ishita',
        'Project_Desc': 'This is a test project'
    }
    add_response=addproject(user_email, body)
    project_id=json.loads(add_response['body'])[0]['Project_Id']

    response=deleteproject(user_email, project_id)    
    assert response['statusCode'] == 200

    get_response=getproject(user_email, project_id)
    assert get_response['statusCode'] == 404

# #delete- project not found
@mock_aws
def test_deleteproject_notfound(dynamodb_mock):
    user_email='ishizgup@amazon.com'
    response=deleteproject(user_email, '123')
    assert response['statusCode'] == 404