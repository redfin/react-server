#!/usr/bin/env python

import argparse
from base64 import b64decode
import boto3
import json

"""
Use this script to decrypt credentials that were secured using the
"react-server-key" KMS key.
"""

CREDENTIALS = "CiBbAtEwdYIxxPI8vGiKYis3wg50uTv7BgqE9ToloMO22RLVAQEBAgB4WwLRMHWCMcTyPLxoimIrN8IOdLk7+wYKhPU6JaDDttkAAACsMIGpBgkqhkiG9w0BBwaggZswgZgCAQAwgZIGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMPJG4ubfWdH4NfODaAgEQgGUsBv5V/jbXL8JbSxnBy2cY8ycUd9YwGRV/eOg02UtcSwHr3hjQq2f8VME5/Hb2lW9viKbhjx7yKIqXvCSOnhLVZPE/rSEFaWpWFB3y6RCiM/MqKFEhS5TVED/Ep3eVhDiwjVKfRQ=="

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
