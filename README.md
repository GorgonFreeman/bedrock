# bedrock

A high-intention backend that prioritises developer experience and convention-over-configuration.

## Key Features

- credentials are in a .yml file that is transposed into .env. Use different credentials by creating more nodes
- example curl commands in each function demonstrate use, and can be used to action things locally
- easily deploy standalone functions to e.g. Google Cloud with .hosting.yml
- advanced patterns for pagination and fetching handle logic like retrying, using auth, and getting all items over multiple pages
- Getter and Processor classes allow streaming data and actioning without waiting for large fetches, where desired

## Architectural Issues

- Not easy to reuse functions outside bedrock due to creds needing to be hardcoded inside the repo. 
  - Allowing bringing own creds could solve this.
- Using actioners within a wider context can involve refetching the same data.
  - Could change all functions to allow using prefetched data if available, instead of identifier > fetch, if an identifier is involved.
- askQuestion prompts pile up in larger functions and answer concurrently. Ideally you would answer one at a time.
- Should a successful operation that takes no action or finds no data correctly return success: true or false? Currently inconsistent.
  - Potentially differentiate between errors from the universe vs errors from this action.
- Returning error(s) is not consistent. Returning an array makes sense but currently is not really helpful.

