import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

bucketName='task-manager-app-files'
s3_client = boto3.client('s3',region_name='us-east-1')
client = boto3.resource('dynamodb')
table = client.Table('projects')
header={
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type':'application/json'
    }
def lambda_handler(event, context):
    
    print("event: ",event)
    http_method=event['httpMethod']
    path=event['path']
    print(path)
    print(http_method)
    project_id = event['pathParameters']['project_id']
    task_id=event['pathParameters']['task_id']
    
    
    getDownloadUrlPath=f"/projects/{project_id}/tasks/{task_id}/file/geturl"
    getUploadUrlPath=f"/projects/{project_id}/tasks/{task_id}/file/geturl"
    AddFilePath=f"/projects/{project_id}/tasks/{task_id}/file"
    deletefilepath=f"/projects/{project_id}/tasks/{task_id}/file"
    
    print(getDownloadUrlPath)
    if http_method=="GET" and path==getDownloadUrlPath:
        return getDownloadUrl(event)
    elif http_method=="POST" and path==getUploadUrlPath:
        return getUploadUrl(event)
    elif http_method=="POST" and path==AddFilePath:
        return addFile(event)
    elif http_method=="GET" and path==AddFilePath:
        return getallfiles(event)
    elif http_method=="DELETE" and path==deletefilepath:
        return deletefile(event)
    else:
        return{
            'statusCode':400,
            'headers':header,
            'body':json.dumps("Unsupported method or path")
        }
def getDownloadUrl(event):
    bucket_name = bucketName
    object_key=event['queryStringParameters']['file_name']
    print("file",object_key)
    expiration=3600
    print(event)
    try:
        response = s3_client.generate_presigned_url('get_object',Params={'Bucket': bucket_name,'Key': object_key},ExpiresIn=expiration)
        
        print(response)
        return {
            'statusCode':200,
            'headers':header,
            'body':json.dumps({'Url': response})
        }    
    
    except ClientError as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"error occurred{str(e)}")
        }
    
def getUploadUrl(event):
    task_id=event['pathParameters']['task_id']
    bucket_name = bucketName
    body=json.loads(event['body'])
    file_name = body['fileName']
    file_type= body['fileType']
    expiration=3600

    try:
        responseItem=table.get_item(
            Key={
                'PK':f"Task#{task_id}",
                'SK':f"File#{file_name}"
            }
        )
        print("item",responseItem)
        if 'Item' in responseItem:
            return{
                'statusCode':409,
                'headers':header,
                'body':json.dumps(f"File with the name {file_name} already exists")
            }
            
        responseURL = s3_client.generate_presigned_url(ClientMethod='put_object',Params={'Bucket': bucket_name,'Key': file_name, 'ContentType':file_type},ExpiresIn=expiration,HttpMethod='PUT')
        
        print(responseURL)
        return {
            'statusCode':200,
            'headers':header,
            'body':json.dumps({'presignedUrl': responseURL})
        }
        
    except ClientError as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"error occurred{str(e)}")
        }
    
    
def addFile(event):
    try:
        task_id=event['pathParameters']['task_id']
        body=json.loads(event['body'])
        file_name=body['fileName']
        
        response=table.put_item(
            Item={
                'PK':f"Task#{task_id}",
                'SK':f"File#{file_name}",
                'File_Name':file_name
            }
        )
        print(response)
        return {
            'statusCode':200,
            'headers':header,
            'body':json.dumps(f"File {file_name} Added in DB")
        }
        
        
    except  ClientError as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"error occurred{str(e)}")
        }   
    
    
def getallfiles(event):
    try:
        task_id=event['pathParameters']['task_id']
        response=table.query(
            KeyConditionExpression=Key('PK').eq(f'Task#{task_id}'),
            ProjectionExpression='File_Name'
        )
        print(response['Items'])
        
        return{
            'statusCode': 200,
            'headers':header,
            'body': json.dumps(response['Items'])
        }
        
    except Exception as e:
        return{
            'statusCode':500,
            'headers':header,
            'body':json.dumps(f"An error occured: {str(e)}")
        }  

def deletefile(event):
    bucket_name = bucketName
    object_key=event['queryStringParameters']['file_name']
    print(event)
    try:

        task_id=event['pathParameters']['task_id']
        # body=json.loads(event['body'])
        file_name=object_key

        try:
            s3_client.get_object(Bucket=bucket_name, Key=object_key)
            
        except ClientError as e:
            return {
                'statusCode': 404,
                'headers': header,
                'body': json.dumps(f"File does not exist in bucket")
            }

        responseItem=table.get_item(
            Key={
                'PK':f"Task#{task_id}",
                'SK':f"File#{file_name}"
            }
        )
        print("item",responseItem)
        if 'Item' not in responseItem:
            return{
                'statusCode':404,
                'headers':header,
                'body':json.dumps(f"File does not exist in table")
            }
        
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)
        print(f"Object '{object_key}' deleted from bucket '{bucket_name}' successfully.")

        response = table.delete_item(
            Key={
                'PK': f"Task#{task_id}",
                'SK': f"File#{file_name}"
            },
            ReturnValues = 'ALL_OLD'
        )
        print("success")
        return {
            'statusCode': 200,
            'headers': header,
            'body': json.dumps(response)
        }
    except Exception as e:
        # Handle any other exceptions
        return {
            'statusCode': 500,
            'headers': header,
            'body': json.dumps(f"An error occured: {str(e)}")
        }