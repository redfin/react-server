#!/usr/bin/env python

import argparse
from base64 import b64decode
import boto3
import json

"""
Use this script to decrypt credentials that were secured using the
"react-server-key" KMS key.
"""

CREDENTIALS = "AQECAHhbAtEwdYIxxPI8vGiKYis3wg50uTv7BgqE9ToloMO22QAAASQwggEgBgkqhkiG9w0BBwagggERMIIBDQIBADCCAQYGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMIT5NelDwVeMLZH5HAgEQgIHYT6g5qKn5/BTniJpjGBaf07Ef/ljtvSRsUfxNcU+rqiINYiZa9ZuWvqn2r7AAaX1kl27y91dv3jDCMtfWpfIGoNLCsxoy1BQPGm65pSp6+nbnWorw9gp/XfHxvWswGRp0maWs7iBhDI0MIb0fs788bvJCyToWjtFLvt7J025ec/LBvkMgYaAPRVKvw1yhhNTI9wJmdGBqmLl+Ygui/E5lcEUZCpQoO9RX8nS2l9I+axH9hPYTObhJJ9pR3ykExAEkgEB54g7SyX8r36MJMaTOn/owlSecRE+l"

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
