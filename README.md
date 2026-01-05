# bedrock
A high-intention backend that prioritises developer experience and convention-over-configuration.

## Key Features
- credentials are in a .yml file that is transposed into .env. Use different credentials by creating more nodes
- example curl commands in each function demonstrate use, and can be used to action things locally
- easily deploy standalone functions to e.g. Google Cloud with .hosting.yml
- advanced patterns for pagination and fetching handle logic like retrying, using auth, and getting all items over multiple pages
- Getter and Processor classes allow streaming data and actioning without waiting for large fetches, where desired
