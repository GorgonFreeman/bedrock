1. Find the documentation online. This must be a url that resolves, not a guess.
1. Open the url in the browser and wait for confirmation from the user before continuing, that it is correct.
1. Make a summary of that documentation in markdown format in the _cursor_reference folder, using snake_case for the filename. Do not include any implementation details, only summarise what you find online. Commit this as `compose [platform] docs summary`, where `[platform]` is the name of the new platform - all lowercase, one word. 
1. Include in the reference file, one curl command that is complete and will work if used, and clearly signal where the credentials must go in the command.
1. Make a new directory called that platform.
1. Identify the necessary credentials and update .creds.yml.sample
1. Commit this as `[platform] platform directory and creds sample`, where `[platform]` is the name of the new platform.
1. Instruct the user to add the credentials to .creds.yml. Do not proceed until the user confirms this is done.
1. Restart the server using `npm run dev`.
1. Choose the first function you want to implement. It should be a non-destructive, read-only function, probably using the 'get' method, and require very little input to reduce the complexity of the initial function.
1. Decide what to call the function based on the other function names, and log this to the user.
1. Use `npm run new` to create the new function. The user will need to input the function name you came up with, or may alter it.
1. Now that the new function is created, implement the required inputs as arguments. Anything optional should go in the "options" object, as in other functions. 
1. Confirm with the user before continuing, and if continuing, commit as "compose [function name] args setup".
1. Now in the body of the function, use credsByPath from utils.js to access the credentials in .creds.yml.
1. Use customAxios from utils.js to make the API request.
1. When you are confident it's working, update the example curl command at the bottom of the file.
1. Run the example command and assess if it's working. Ask the user to verify, if you're not sure.