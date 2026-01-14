import boto3
import json
from moto import mock_aws
import pytest

from teams import lambda_handler, add_team_member,get_team_members,remove2_team_member

project_id='b2d6ec89-12ec-48c9-b5e4-aae4372e3c7c'
dynamodb_table_name='projects'

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
    

@mock_aws
def test_add_team_member(dynamodb_mock):

    table=dynamodb_mock.Table(dynamodb_table_name)
    table.put_item(Item={
        'PK':'User',
        'SK':'#user@example.com',
        'email':'user@example.com',
        'name':'test user'
    })
    
    member_email='user@example.com'
    member_name='test user'

    event={
        'httpMethod':'POST',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'full_name':member_name,
            'email_id':member_email
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event,context=None)
    assert result['statusCode']==200
    assert json.loads(result['body'])=='Team member added successfully'

    res1=table.get_item(Key={'PK':f'Project#{project_id}','SK':f'TeamMember#{member_email}'})
    assert 'Item' in res1
    assert res1['Item']['Team_Member_Email']==member_email

    res2=table.get_item(Key={'PK':f'User#{member_email}', 'SK':f'Project#{project_id}'})
    assert 'Item' in res2


#missing body parameters
@mock_aws
def test_add_team_member_missing_params(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)
    table.put_item(Item={
        'PK':'User',
        'SK':'#user@example.com',
        'email':'user@example.com',
        'name':'test user'
    })
    
    event={
        'httpMethod':'POST',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'email_id':'user@example.com'
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event,context=None)
    assert result['statusCode']==400
    assert json.loads(result['body'])=='Body parameters are missing'  

# #user not present
@mock_aws
def test_add_team_member_user_not_found(dynamodb_mock):

    event={
        'httpMethod':'POST',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'full_name':'test_user',
            'email_id':'user@example.com'
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event,context=None)
    assert result['statusCode']==404
    assert json.loads(result['body'])=='User not found'   

# #email already present
@mock_aws
def test_add_team_member_email_not_present(dynamodb_mock):
    
    table=dynamodb_mock.Table(dynamodb_table_name)
    table.put_item(Item={
        'PK':'User',
        'SK':'#user@example.com',
        'email':'user@example.com',
        'name':'test user'
    })
    table.put_item(Item={
        'PK':f'Project#{project_id}',
        'SK':f'TeamMember#user@example.com',
        'Team_Member_Email':'user@example.com'
    })
    table.put_item(Item={
        'PK':f'User#user@example.com',
        'SK':f'Project#{project_id}',
    })

    event={
        'httpMethod':'POST',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'full_name':'test user',
            'email_id':'user@example.com'
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event,context=None)
    print("result: ",result)
    assert result['statusCode']==409


@mock_aws
def test_get_team_members(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)

    table.put_item(Item={
        'PK':f'Project#{project_id}',
        'SK':f'TeamMember#user@example.com',
        'Team_Member_Email': 'user@example.com',
        'Team_Member_Name': 'test user'
    })
    table.put_item(Item={
        'PK':f'Project#{project_id}',
        'SK':f'TeamMember#user2@example.com',
        'Team_Member_Email': 'user2@example.com',
        'Team_Member_Name': 'test user2'
    })
    event={
        'httpMethod':'GET',
        'pathParameters':{
            'project_id':project_id
        },
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event, context=None)
    assert result['statusCode']==200
    body= json.loads(result['body'])   
    assert len(body)==2 

#no team member found
@mock_aws
def test_get_team_members_no_member(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)
    event={
        'httpMethod':'GET',
        'pathParameters':{
            'project_id':project_id
        },
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event, context=None)
    assert result['statusCode']==404    
    assert json.loads(result['body'])=='No team member found' 

@mock_aws
def test_remove_team_member(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)
    table.put_item(Item={
        'PK':f'Project#{project_id}',
        'SK':f'TeamMember#user@example.com',
        'Team_Member_Email': 'user@example.com',
        'Team_Member_Name': 'test user'
    })
    table.put_item(Item={
        'PK':f'User#user@example.com',
        'SK':f'Project#{project_id}',
    })
    event={
        'httpMethod':'PUT',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'email_id':'user@example.com'
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event, context=None)
    assert result['statusCode']==200
    assert json.loads(result['body'])=='Team member with email user@example.com removed successfully'

    res1=table.get_item(Key={'PK':f'Project#{project_id}', 'SK':f'TeamMember#user@example.com'})
    assert 'Item' not in res1

    res2=table.get_item(Key={'PK':f'User#user@example.com', 'SK':f'Project#{project_id}'})
    assert 'Item' not in res2
   
#email is not present in body
@mock_aws
def test_remove_team_member_email_not_given(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)
    table.put_item(Item={
        'PK':f'Project#{project_id}',
        'SK':f'TeamMember#user@example.com',
        'Team_Member_Email': 'user@example.com',
        'Team_Member_Name': 'test user'
    })
    table.put_item(Item={
        'PK':f'User#user@example.com',
        'SK':f'Project#{project_id}',
    })
    event={
        'httpMethod':'PUT',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event, context=None)
    assert result['statusCode']==400

#team member not found
@mock_aws
def test_remove_team_member_not_found(dynamodb_mock):
    table=dynamodb_mock.Table(dynamodb_table_name)
    event={
        'httpMethod':'PUT',
        'pathParameters':{
            'project_id':project_id
        },
        'body':json.dumps({
            'email_id':'user@example.com'
        }),
        'path':f'/projects/{project_id}/members'
    }

    result=lambda_handler(event, context=None)
    assert result['statusCode']==404
    assert json.loads(result['body'])==f"Team member with email user@example.com does not exist in the project {project_id}"