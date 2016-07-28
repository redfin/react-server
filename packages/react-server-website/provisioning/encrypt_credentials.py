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
        'slack.api.token': args.slack_key,
    }

    kms = boto3.client('kms', 'us-west-2')
    data = b64encode(kms.encrypt(
        KeyId='alias/react-server-key', Plaintext=json.dumps(data)
    )['CiphertextBlob'])

    print data

    print kms.decrypt(CiphertextBlob=b64decode(data))['Plaintext']

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Encrypt credentials.')
    parser.add_argument('--slack-api-key', dest='slack_key',
                        help='Slack API key', required=True)

    args = parser.parse_args()
    encrypt(args)
