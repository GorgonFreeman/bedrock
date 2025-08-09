1. Find the documentation online.
1. Make a new directory called that platform. All lowercase, one word.
1. Identify the necessary credentials and update .creds.yml.sample
1. Commit this as `[platform] platform directory and creds sample`
1. Instruct the user to add the credentials to .creds.yml.
1. Restart the server using `npm run dev`.
1. Add a simple function. Use `npm run new` to do it. This should not be a destructive action like update or delete - it should be a read-only function, likely using the 'get' method.
1. Using credsByPath from utils.js and customAxios from utils.js, complete the function until you are confident it is working, using an example command in a comment at the bottom of the file.
1. Wait for confirmation before continuing.