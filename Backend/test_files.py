import pytest
from moto import mock_aws
import boto3
import json
from files import lambda_handler, bucketName
import requests

@pytest.fixture
def dynamodb():
    with mock_aws():
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='projects',
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
        table.meta.client.get_waiter('table_exists').wait(TableName='projects')
        yield table

@pytest.fixture
def s3():
    with mock_aws():
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket=bucketName)
        yield s3


#download url if file is uploaded in s3
@mock_aws
def test_getDownloadUrl(dynamodb, s3):
    event = {
        'httpMethod': 'GET',
        'path': '/projects/1/tasks/1/file/geturl',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'queryStringParameters': {'file_name': 'testfile.txt'}
    }

    s3.put_object(Bucket=bucketName, Key='testfile.txt', Body=b'This is a test file')

    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200
    assert 'Url' in json.loads(response['body'])
    download_url = json.loads(response['body'])['Url']
    download_response = requests.get(download_url)
    print(download_response)
    assert download_response.status_code == 200

#download url if file is not uploaded in s3
@mock_aws
def test_getDownloadUrlWithoutUpload(dynamodb, s3):
    event = {
        'httpMethod': 'GET',
        'path': '/projects/1/tasks/1/file/geturl',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'queryStringParameters': {'file_name': 'testfile.txt'}
    }
    
    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200
    assert 'Url' in json.loads(response['body'])
    download_url = json.loads(response['body'])['Url']
    download_response = requests.get(download_url)
    print(download_response)
    assert download_response.status_code == 404

@mock_aws
def test_getUploadUrl(dynamodb,s3):

    event = {
        'httpMethod': 'POST',
        'path': '/projects/1/tasks/1/file/geturl',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'body': json.dumps({'fileName': 'testfile.txt', 'fileType': 'text/plain'})
    }

    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200
    assert 'presignedUrl' in json.loads(response['body'])

@mock_aws
def test_getUploadUrlSameFileExists(dynamodb,s3):

    response=dynamodb.put_item(
            Item={
                'PK':f"Task#1",
                'SK':f"File#testfile.txt",
                'File_Name':'testfile.txt'
            }
        )
    event = {
        'httpMethod': 'POST',
        'path': '/projects/1/tasks/1/file/geturl',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'body': json.dumps({'fileName': 'testfile.txt', 'fileType': 'text/plain'})
    }

    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 409

@mock_aws    
def test_addFile(dynamodb):
    event = {
        'httpMethod': 'POST',
        'path': '/projects/1/tasks/1/file',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'body': json.dumps({'fileName': 'testfile.txt'})
    }

    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200
    assert 'File testfile.txt Added in DB' in json.loads(response['body'])
    # Verify the item in DynamoDB
    responseItem = dynamodb.get_item(
        Key={
            'PK': 'Task#1',
            'SK': 'File#testfile.txt'
        }
    )
    assert 'Item' in responseItem
    assert responseItem['Item']['File_Name'] == 'testfile.txt'

@mock_aws    
def test_getallfiles(dynamodb):
    # Add an item first
    dynamodb.put_item(
        Item={'PK': 'Task#1', 'SK': 'File#testfile.txt', 'File_Name': 'testfile.txt'}
    )
    event = {
        'httpMethod': 'GET',
        'path': '/projects/1/tasks/1/file',
        'pathParameters': {'project_id': '1', 'task_id': '1'}
    }
    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200
    items = json.loads(response['body'])
    assert len(items) == 1
    assert items[0]['File_Name'] == 'testfile.txt'

@mock_aws
def test_deletefile(dynamodb,s3):
    # Add an item first
    dynamodb.put_item(
        Item={'PK': 'Task#1', 'SK': 'File#testfile.txt', 'File_Name': 'testfile.txt'}
    )
    s3.put_object(Bucket=bucketName, Key='testfile.txt')
    event = {
        'httpMethod': 'DELETE',
        'path': '/projects/1/tasks/1/file',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'queryStringParameters': {'file_name': 'testfile.txt'}
    }
    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 200

    # Verify the item is deleted from DynamoDB
    responseItem = dynamodb.get_item(
        Key={
            'PK': 'Task#1',
            'SK': 'File#testfile.txt'
        }
    )
    assert 'Item' not in responseItem

    #Verify the file is deleted from S3
    responseS3 = s3.list_objects_v2(Bucket=bucketName)
    assert responseS3['KeyCount']==0

@mock_aws
def test_deletefileNotInS3(dynamodb):
    # Add an item first
    dynamodb.put_item(
        Item={'PK': 'Task#1', 'SK': 'File#testfile.txt', 'File_Name': 'testfile.txt'}
    )
    
    event = {
        'httpMethod': 'DELETE',
        'path': '/projects/1/tasks/1/file',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'queryStringParameters': {'file_name': 'testfile.txt'}
    }
    response = lambda_handler(event, context=None)
    print("r: ",response)
    assert response['statusCode'] == 404
    body_json=json.loads(response['body'])
    assert body_json=="File does not exist in bucket"

@mock_aws
def test_deletefileNotInTable(dynamodb,s3):
    # Add object in bucket
    s3.put_object(Bucket=bucketName, Key='testfile.txt')
    event = {
        'httpMethod': 'DELETE',
        'path': '/projects/1/tasks/1/file',
        'pathParameters': {'project_id': '1', 'task_id': '1'},
        'queryStringParameters': {'file_name': 'testfile.txt'}
    }
    response = lambda_handler(event, context=None)
    assert response['statusCode'] == 404
    body_json=json.loads(response['body'])
    assert body_json=="File does not exist in table"










