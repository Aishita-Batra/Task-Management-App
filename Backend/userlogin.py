import json
import boto3
from botocore.exceptions import ClientError
client = boto3.resource('dynamodb')
table = client.Table('projects')
ses_client = boto3.client('ses', region_name='us-east-1')

header={
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type':'application/json'
    }
    
def lambda_handler(event, context):
    # TODO implement
    print("event:",event)
    print("Context:",context)
    userAttributes=event['request']['userAttributes']
    print(userAttributes)
    #Constructing Keys
    partition_key="User"
    sort_key=f"#{userAttributes['email']}"
    if 'sub' in event['request']['userAttributes']:
        try:
            table.put_item(
                Item = {
                    'PK': partition_key,
                    'SK':sort_key,
                    'email':userAttributes['email'],
                    'name':userAttributes['name'],
                }
            )
            
            
            # Verify the user's email address in the SES sandbox
            email_address = event['request']['userAttributes']['email']
            verify_email_address(email_address)
            
            print("Success, User added")
            return event
            
        except Exception as e:
            print(f"Error writing data to DynamoDB: {e.response['Error']['Message']}")
            return event
    else:
        print("Nothing is written to DDB")
        return event

def verify_email_address(email_address):
    try:
        # Verify the email address
        response = ses_client.verify_email_identity(
            EmailAddress=email_address
        )
        print(f"Email address {email_address} has been verified.")
    except ses_client.exceptions.EmailAddressInUseException:
        print(f"Email address {email_address} is already verified.")
    except Exception as e:
        print(f"Failed to verify email address {email_address}: {str(e)}")