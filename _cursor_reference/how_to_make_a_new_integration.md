1. Find the documentation online. This must be a url that resolves, not a guess.
1. Open the url in the browser and wait for confirmation from the user before continuing, that it is correct.
1. Make a summary of that documentation in markdown format in the _cursor_reference folder, using snake_case for the filename. Do not include any implementation details, only summarise what you find online. Commit this as `compose [platform] docs summary`, where `[platform]` is the name of the new platform - all lowercase, one word.
1. Make a new directory called that platform.
1. Identify the necessary credentials and update .creds.yml.sample
1. Commit this as `[platform] platform directory and creds sample`, where `[platform]` is the name of the new platform.
1. Instruct the user to add the credentials to .creds.yml. Do not proceed until the user confirms this is done.
1. Restart the server using `npm run dev`.
1. Add a simple function based on the API documentation. Inform the user which function you want to integrate. Use `npm run new` to do it. This should not be a destructive action like update or delete - it should be a read-only function, likely using the 'get' method, and require the least possible input so that ideally, it can be done with no prior knowledge of the data. Do not create any other files during this process.
1. Using credsByPath from utils.js and customAxios from utils.js, complete the function until you are confident it is working, noting an example command in a comment at the bottom of the file.
1. Run the example command and assess if the function is working correctly. Ask the user to verify, if you are not sure.