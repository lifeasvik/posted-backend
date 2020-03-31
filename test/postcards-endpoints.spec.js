const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Postcards Endpoints", function() {
  let db;

  const {
    testUsers,
    testPostcards,
    testComments
  } = helpers.makePostcardsFixtures();

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`GET /api/postcards`, () => {
    context(`Given no postcards`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/postcards")
          .expect(200, []);
      });
    });

    context("Given there are postcards in the database", () => {
      beforeEach("insert postcards", () =>
        helpers.seedPostcardsTables(db, testUsers, testPostcards, testComments)
      );

      it("responds with 200 and all of the postcards", () => {
        const expectedPostcards = testPostcards.map(postcard =>
          helpers.makeExpectedPostcard(testUsers, postcard, testComments)
        );
        return supertest(app)
          .get("/api/postcards")
          .expect(200, expectedPostcards);
      });
    });

    context(`Given an XSS attack postcard`, () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousPostcard,
        expectedPostcard
      } = helpers.makeMaliciousPostcard(testUser);

      beforeEach("insert malicious postcard", () => {
        return helpers.seedMaliciousPostcard(db, testUser, maliciousPostcard);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/postcards`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedPostcard.title);
            expect(res.body[0].content).to.eql(expectedPostcard.content);
          });
      });
    });
  });

  describe(`GET /api/postcards/:postcard_id`, () => {
    context(`Given no postcards`, () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it(`responds with 404`, () => {
        const postcardId = 123456;
        return supertest(app)
          .get(`/api/postcards/${postcardId}`)
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Postcard doesn't exist` });
      });
    });

    context("Given there are postcards in the database", () => {
      beforeEach("insert postcards", () =>
        helpers.seedPostcardsTables(db, testUsers, testPostcards, testComments)
      );

      it("responds with 200 and the specified postcard", () => {
        const postcardId = 2;
        const expectedPostcard = helpers.makeExpectedPostcard(
          testUsers,
          testPostcards[postcardId - 1],
          testComments
        );

        return supertest(app)
          .get(`/api/postcards/${postcardId}`)
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedPostcard);
      });
    });

    context(`Given an XSS attack postcard`, () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousPostcard,
        expectedPostcard
      } = helpers.makeMaliciousPostcard(testUser);

      beforeEach("insert malicious postcard", () => {
        return helpers.seedMaliciousPostcard(db, testUser, maliciousPostcard);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/postcards/${maliciousPostcard.id}`)
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedPostcard.title);
            expect(res.body.content).to.eql(expectedPostcard.content);
          });
      });
    });
  });

  describe(`GET /api/postcards/:postcard_id/comments`, () => {
    context(`Given no postcards`, () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it(`responds with 404`, () => {
        const postcardId = 123456;
        return supertest(app)
          .get(`/api/postcards/${postcardId}/comments`)
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Postcard doesn't exist` });
      });
    });

    context("Given there are comments for postcard in the database", () => {
      beforeEach("insert postcards", () =>
        helpers.seedPostcardsTables(db, testUsers, testPostcards, testComments)
      );

      it("responds with 200 and the specified comments", () => {
        const postcardId = 1;
        const expectedComments = helpers.makeExpectedPostcardComments(
          testUsers,
          postcardId,
          testComments
        );

        return supertest(app)
          .get(`/api/postcards/${postcardId}/comments`)
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedComments);
      });
    });
  });
});
