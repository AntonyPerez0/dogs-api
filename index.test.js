const request = require("supertest");
// express app
const app = require("./index");

// db setup
const { sequelize, Dog } = require("./db"); //
const seed = require("./db/seedFn"); //
const { dogs } = require("./db/seedData"); //

describe("Endpoints", () => {
  // to be used in POST test
  const testDogData = {
    breed: "Poodle",
    name: "Sasha",
    color: "black",
    description:
      "Sasha is a beautiful black pooodle mix.  She is a great companion for her family.",
  };

  beforeAll(async () => {
    // rebuild db before the test suite runs
    await seed(); //
  });

  describe("GET /dogs", () => {
    it("should return list of dogs with correct data", async () => {
      // make a request
      const response = await request(app).get("/dogs"); //
      // assert a response code
      expect(response.status).toBe(200); //
      // expect a response
      expect(response.body).toBeDefined(); //
      // toEqual checks deep equality in objects
      expect(response.body[0]).toEqual(expect.objectContaining(dogs[0])); //
    });
  });

  // Test for POST /dogs
  describe("POST /dogs", () => {
    let postId; // To store the id of the created dog for the second test

    it("should create a new dog and return its data", async () => {
      const response = await request(app).post("/dogs").send(testDogData); // Send testDogData in the request body

      expect(response.status).toBe(200); // The API sends 200 on successful post
      expect(response.body).toBeDefined();
      // Assert that the data coming back matches the data in testDogData
      expect(response.body).toEqual(expect.objectContaining(testDogData));
      expect(response.body.id).toBeDefined(); // Ensure the response has an ID
      postId = response.body.id; // Save the id for the next test
    });

    it("should find the created dog in the database", async () => {
      // Query the database for a dog of id matching that of the response.body.id
      const dogInDb = await Dog.findByPk(postId); //

      expect(dogInDb).toBeDefined();
      // Assert that the dog data from the database matches the request body
      // Need to convert dogInDb.toJSON() to compare plain objects if it's a Sequelize instance
      expect(dogInDb.toJSON()).toEqual(expect.objectContaining(testDogData));
    });
  });

  // Test for DELETE /dogs/:id
  describe("DELETE /dogs/:id", () => {
    let dogToDeleteId = 1; // Assuming a dog with ID 1 exists from the seed data

    it("should delete a dog and confirm deletion message", async () => {
      const response = await request(app).delete(`/dogs/${dogToDeleteId}`);

      expect(response.status).toBe(200); // API sends 200 on successful delete
      expect(response.text).toBe(`deleted dog with id ${dogToDeleteId}`); //
    });

    it("should not find the deleted dog in the database", async () => {
      // Query the database for a dog with ID of dogToDeleteId
      const dogInDb = await Dog.findByPk(dogToDeleteId); //

      // Assert that the dog returned is null (not found)
      expect(dogInDb).toBeNull();
    });

    it("should return 404 if trying to delete a non-existent dog", async () => {
      const nonExistentId = 9999;
      const response = await request(app).delete(`/dogs/${nonExistentId}`);

      expect(response.status).toBe(404); //
      expect(response.text).toBe(`Dog with id ${nonExistentId} not found`); //
    });
  });
});
