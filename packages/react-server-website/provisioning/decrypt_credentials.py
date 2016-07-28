#!/usr/bin/env python

import argparse
from base64 import b64decode
import boto3
import json

"""
Use this script to decrypt credentials that were secured using the
"react-server-key" KMS key.
"""

CREDENTIALS = "AQECAHhbAtEwdYIxxPI8vGiKYis3wg50uTv7BgqE9ToloMO22QAAAKwwgakGCSqGSIb3DQEHBqCBmzCBmAIBADCBkgYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAyoRYB+NK3K3BSeY/ACARCAZV0HyDnvcGe/FdzqUB1TiJAYQvaRwhf9rq9xpr503VbU+Wmx6043gnZ52u3e1xKB8bVX3hIFzlQGsF1WYT6RQqaClKlNl76MBl9dQ5nC+mpmgDx1Sp8Tpcxh48iY98V/IOdXW4ZA"

def decrypt(args):
    kms = boto3.client('kms', 'us-west-2')
    d = json.loads(
        kms.decrypt(
            CiphertextBlob=b64decode(CREDENTIALS)
        )['Plaintext']
    )
    print d.get(args.key) if args.key else d

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Decrypt credentials.')
    parser.add_argument('--key', '-k', dest='key',
                        help='Key of value to return')

    args = parser.parse_args()
    decrypt(args)
