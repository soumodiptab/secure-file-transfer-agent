
# Code Documentation

This is a Node.js application that uses Express.js as the web framework, and it also utilizes several external packages. The code provides an API to handle requests from clients and responds with data from the server.


## Run Server

Clone the project

```bash
  git clone https://github.com/soumodiptab/Blogger.git
```

Go to the project directory

```bash
  cd Blogger/src/dfs-server
```

Install dependencies

```bash
  npm install express
  npm install csv-parser
  npm install fs
  npm install bcrypt
  npm install axios
  npm install mime
  npm install winston
```

Start the server

```bash
  node app.js
```




## API Reference

#### Get all items

```http
  POST /login
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `ipaddress` | `string` | **Required**. Your ip_address |

#### Get item

```http
  GET /sender_request
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `uuid`      | `string` | **Required**. a unique identifier for the file transfer |
| `filename`      | `string` | **Required**. the name of the file being transferred |
| `size`      | `string` | **Required**. the size of the file in bytes |
| `sender_id`      | `string` | **Required**. the ID of the sender institution |
| `secret_key`      | `string` | **Required**. a secret key for encrypting the file |
| `receiver_id`      | `string` | **Required**. the ID of the receiving institution |




## Dependencies

- express: A Node.js web framework for building web applications.
- csv-parser: A Node.js library for parsing CSV files.
- fs: A Node.js library for working with the file system.
- bcrypt: A Node.js library for hashing passwords.
- axios: A Node.js library for making HTTP requests.
- mime: A Node.js library for working with MIME types.
- winston: A Node.js library for logging.

## Middleware

- express.json(): A middleware function that parses incoming JSON payloads.
- express.static(): This middleware serves static files from the public directory. It sets the Content-Type header of the response based on the MIME type of the requested file.

## Winston Logger Configuration

- createLogger: Creates an instance of a logger.
- transports.File: A transport for Winston logger that writes logs to a file.
- format.timestamp(): A formatter that adds a timestamp to log messages.
- format.json(): A formatter that formats log messages as JSON.

## Static Files

/public: Serves static files from the public directory and sets the Content-Type header of the response based on the file extension using the mime library.

## Endpoints

The server provides the following endpoints:

1. `/` :This route handler serves the homepage. It renders an EJS template called index.ejs

2. `/history`: This route handler serves the history page. It reads data from a server.log file and renders an EJS template called history.ejs. 

The history route handler reads the last 20 lines of the server.log file, parses them into JSON objects, and sorts them by timestamp in descending order.

3. `/current`: This route handler serves the current page. It simply renders an EJS template called current.ejs.

4. `/login`: This route handler is called when the client sends a POST request to the /login endpoint. It reads data from a CSV file called users.csv that contains usernames and passwords, hashes the passwords using the bcrypt library, and returns the hashed passwords in a JSON response.

5. `/sender_request`: This route handler is called when the client sends a POST request to the /sender_request endpoint. It expects the following parameters to be passed in the request body:

- uuid: a unique identifier for the file transfer
- filename: the name of the file being transferred
- size: the size of the file in bytes
- sender_id: the ID of the sender institution
- secret_key: a secret key for encrypting the file
- receiver_id: the ID of the receiving institution

The route handler reads the IP address of the receiving institution from a CSV file called users.csv, makes a POST request to the receiving institution's API with the necessary data, and returns a response to the sender API based on the DFS (Distributed File System) response status.

