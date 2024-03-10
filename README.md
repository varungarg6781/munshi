This project is designed to provide a seamless chat experience where users can upload PDF files, create chats around them, and interact with an AI assistant. The AI assistant uses the OpenAI API to generate responses based on the chat context.

## Getting Started

1. Install the required dependencies
```bash
npm install
```
2. run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Application Logic
<img width="447" alt="Screenshot 2024-02-24 at 8 44 38 PM" src="https://github.com/varungarg6781/chatpdf/assets/12528253/23863e54-3e0b-41cb-93c8-b700f583edbb">


## Tech stack 
<img width="820" alt="Screenshot 2024-02-24 at 8 19 05 PM" src="https://github.com/varungarg6781/chatpdf/assets/12528253/9f932560-2c74-4b10-a48b-501ea0d1ce74">


## Components Workflow
<img width="933" alt="Screenshot 2024-02-24 at 8 19 15 PM" src="https://github.com/varungarg6781/chatpdf/assets/12528253/7c503e47-5133-4747-b306-23ddbf50dc90">

## Components

Here's a breakdown of the key components and their roles within this application:

**page.tsx**
This is our home page component. It conditionally renders UI elements based on user authentication status and provides a mechanism for users to upload PDF files through the FileUpload component if authenticated. It also displays a link to the first chat if any exists, alongside a brief description of the application's purpose.

**layouts.tsx**
Serves as the root layout for our application, wrapping all page content. It utilizes ClerkProvider for authentication purposes and Providers for setting up context providers like QueryClientProvider from @tanstack/react-query for data fetching management.

**app/api/chat/route.ts**
Defines an API route for chat-related operations. It integrates with OpenAI's API to generate chat completions based on user input and a given context, saving both user and AI messages to a database.

**api/create-chat/route.ts**
This API route handles the creation of new chat sessions, including storing metadata about the uploaded PDF in a database and potentially pre-processing the PDF for chat interactions using loadS3IntoPinecone.

**api/get-messages/route.ts**
Retrieves chat messages for a given chat session from the database, likely for rendering in the chat UI.

**app/chat/[chat]/page.tsx**
A dynamic page for individual chat sessions, displaying the chat interface (ChatComponent), a sidebar with chat sessions (ChatSideBar), and a PDF viewer (PDFViewer).

**Components under /components:**
1. **ChatComponent**: Manages the chat input and displays chat messages using MessageList. It interacts with the /api/chat endpoint for sending and receiving chat messages.
2. **ChatSideBar**: Displays a list of chat sessions and provides navigation between them.
3. **FileUpload**: Handles file upload functionality, allowing users to upload PDF files. It uses a custom hook from @tanstack/react-query for mutation operations and provides visual feedback during the file upload process.
4. **MessageList**: Renders a list of chat messages, showing a loading indicator if data is being fetched.
5. **Providers**: Sets up global context providers for your application, including QueryClientProvider for react-query.

**/lib directory:**
1. **db**: Contains database-related utilities, including the initial setup with drizzle-orm and schema definitions for your tables (chats, messages, etc.).
2. **context.ts**: Likely contains logic for generating chat context based on the content of the uploaded PDFs, integrating with Pinecone for vector searches.
3. **embeddings.ts**: Handles communication with OpenAI's API to generate embeddings for text, which could be used for matching queries with content in your PDF documents.
4. **pinecone.ts**: Manages interactions with Pinecone, a vector database, for storing and querying document embeddings.
5. **s3-server.ts & s3.ts**: Provide utilities for interacting with AWS S3, including uploading files to and downloading files from S3 buckets.
6. **utils.ts**: Contains utility functions, such as convertToAscii, which cleans up strings for compatibility with certain systems or APIs.


