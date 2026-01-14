import pytest
from moto import mock_aws
import boto3
import json

from userlogin import lambda_handler, verify_email_address

dynamodb_table_name='projects'

@pytest.fixture
def setUp():
    with mock_aws():
    # Set up mock DynamoDB
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
        # Set up mock SES
        ses = boto3.client('ses', region_name='us-east-1')
        yield dynamodb,table,ses

@mock_aws
def test_lambda_handler(setUp):
    dynamodb,table,ses = setUp
    event = {
        'request': {
            'userAttributes': {
                'sub': '1234567890',
                'email': 'user@example.com',
                'name': 'Test User'
            }
        }
    }
    result = lambda_handler(event, context=None)
    # Verify that the item was added to DynamoDB
    response = table.get_item(Key={'PK': 'User', 'SK': '#user@example.com'})
    assert 'Item' in response
    assert response['Item']['email'] == 'user@example.com'
    assert response['Item']['name'] == 'Test User'
    # Verify that the email verification was called
    verified_emails = ses.list_identities(IdentityType='EmailAddress')['Identities']
    assert 'user@example.com' in verified_emails
    # Verify the lambda response
    assert result == event

@mock_aws
def test_verify_email_address(setUp):
    dynamodb, table, ses = setUp
    email_address = 'user@example.com'
    verify_email_address(email_address)
    # Verify that the email address was verified in SES
    verified_emails = ses.list_identities(IdentityType='EmailAddress')['Identities']
    assert email_address in verified_emails

@mock_aws
def test_lambda_handler_without_sub(setUp):
    dynamodb, table, ses = setUp
    event = {
        'request': {
            'userAttributes': {
                'email': 'test@example.com',
                'name': 'Test User'
            }
        }
    }
    result = lambda_handler(event, context=None)
    # Verify that no item was added to DynamoDB
    response = table.get_item(Key={'PK': 'User', 'SK': '#test@example.com'})
    assert 'Item' not in response
    # Verify the lambda response
    assert result == event

