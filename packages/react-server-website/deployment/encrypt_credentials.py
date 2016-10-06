import argparse
from base64 import b64decode, b64encode
import boto3
import json

"""
Use this script to generate a new encrypted data blob that contains secrets we
need on the production machine.
"""

def encrypt(args):
    data = {
        'asini-slack.api.token'        : args.asini_slack_key,
        'react-server-slack.api.token' : args.react_server_slack_key,
    }

    kms = boto3.client('kms', 'us-west-2')
    data = b64encode(kms.encrypt(
        KeyId='alias/react-server-key', Plaintext=json.dumps(data)
    )['CiphertextBlob'])

    print data

    print kms.decrypt(CiphertextBlob=b64decode(data))['Plaintext']

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Encrypt credentials.')
    parser.add_argument('--asini-slack-api-key',
                        dest='asini_slack_key',
                        help='Asini Slack API key', required=True)
    parser.add_argument('--react-server-slack-api-key',
                        dest='react_server_slack_key',
                        help='React Server Slack API key', required=True)

    args = parser.parse_args()
    encrypt(args)
