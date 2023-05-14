const request = require("supertest");
const express = require("express");
const app = require("../server");

// jest.mock("express", () => ({
//   ...jest.requireActual("express"),
//   isAuthenticated: jest.fn((req, res, next) => next()),
// }));

describe("Protected Routes", () => {
  it("should return 200 OK for authenticated route", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});

describe("Authentication invalidate incorrect user", () => {
  it("Login unauthorized user test ", async () => {
    const res = await request(app).post("/login").send({
      username: "200",
      password: "@200",
    });
    expect(res.status).toBe(302);
    // Add more assertions as needed
  });
});

describe("Fetch directory details", () => {
  it("Directory listing", async () => {
    const res = await request(app).get("/dir");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});

describe("GET Upload request 1", () => {
  it("Upload GET request validation ", async () => {
    const res = await request(app).get("/upload");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});

describe("GET Upload request 2", () => {
  it("Upload GET request validation ", async () => {
    const res = await request(app).get("/upload");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});

describe("POST Upload request", () => {
  it("Upload POST request validation ", async () => {
    const res = await request(app).post("/upload").send({
      username: "200",
      finalpath: "/home/200/Downloads",
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain("Error in file upload");
    // Add more assertions as needed
  });
});

describe("REQUESTS fetching", () => {
  it("GET requests that have been ", async () => {
    const res = await request(app).get("/requests");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});

describe("Downloads fetching", () => {
  it("GET downloads that have been ongoing", async () => {
    const res = await request(app).get("/downloads");
    expect(res.status).toBe(200);
    // Add more assertions as needed
  });
});
