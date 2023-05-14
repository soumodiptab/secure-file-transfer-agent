const request = require("supertest");
const express = require("express");
const fs = require("fs");
const { createLogger, transports, format } = require("winston");
const bcrypt = require("bcrypt");
const axios = require("axios");
const csv = require("csv-parser");
const mime = require("mime");

const app = require("../app"); // assuming the code is in a separate file named "app.js"

// Mock the fs.readFileSync function to return sample server.log data
// jest.mock("fs", () => ({
//   readFileSync: jest.fn(() => "sample log data"),
//   createReadStream: jest.fn(() => ({
//     pipe: jest.fn(() => ({
//       on: jest.fn(),
//     })),
//   })),
// }));

// // Mock the bcrypt.hash function
jest.mock("bcrypt", () => ({
  hash: jest.fn((password, saltRounds) => Promise.resolve("hashedPassword")),
}));

// // Mock the axios.post function
jest.mock("axios");

// Mock the winston logger
// jest.mock("winston", () => ({
//   createLogger: jest.fn(() => ({
//     level: "info",
//     transports: [new transports.File({})],
//     info: jest.fn(),
//     error: jest.fn(),
//   })),
// }));

describe("Unit & Integration Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the index template on "/" route', async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toContain("Data Foundation Server");
  });

  it('should parse and render the history template on "/history" route', async () => {
    const response = await request(app).get("/history");
    expect(response.status).toBe(200);
    expect(response.text).toContain("history");

    // Verify the mock function calls
    // expect(fs.readFileSync).toHaveBeenCalledWith("server.log", "utf8");
    // expect(createLogger).toHaveBeenCalledWith({
    //   level: "info",
    //   transports: [expect.any(transports.File)],
    // });
  });

  it('should return encrypted data on "/login" route', async () => {
    // const mockCsvStream = { pipe: jest.fn().mockReturnThis(), on: jest.fn() };
    // fs.createReadStream.mockReturnValue(mockCsvStream);

    const response = await request(app).post("/login").send({
      ip_address: "localhost:3000",
    });
    expect(response.status).toBe(200);
    console.log(response.body);
    expect(response.body).toEqual([
      { username: "100", password: "hashedPassword" },
      { username: "200", password: "hashedPassword" },
    ]);
  });
});


