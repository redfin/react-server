We need to be certain there aren't any packages that run tests on
the same port, as our CI test target runs many packages' tests 
simultaneously, so port conflicts will fail the tests.  Make sure
to update this manifest when adding a test that starts a server.

## generator-react-server 
3010, 3011

## react-server-integration-test
8770, 3001
