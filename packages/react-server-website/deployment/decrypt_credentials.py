#!/usr/bin/env python

import argparse
from base64 import b64decode
import boto3
import json

"""
Use this script to decrypt credentials that were secured using the
"react-server-key" KMS key.
"""

CREDENTIALS = "AQECAHhbAtEwdYIxxPI8vGiKYis3wg50uTv7BgqE9ToloMO22QAAALkwgbYGCSqGSIb3DQEHBqCBqDCBpQIBADCBnwYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAw3wqefOPSk83O6WEUCARCAcoDVhenVrxWK5B4sD0RD99Fy6wf/VBLPncZKPcgjWnonRYoUT03sAN47NnoBVuxbRiQfnH58l9Omqoiasf2rDTISicsbrLPHw0SvN+qY+E+PkcW8sEkOMB9QF5ZwTYkLJvhT8KKgYb1xEJnhr3tKf18xJQ=="

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
