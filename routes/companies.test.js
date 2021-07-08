process.env.NODE_ENV = 'test';
const request = require(supertest);
const app = require('../app');
const db = require('../db');

beforeEach(async function () {
    let compResult = await db.query(`
        INSERT INTO companies
         VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
         RETURNING code, name, description`);
    let invResult = await db.query(`
        INSERT INTO invoices (comp_code, amt, paid, paid_date)
         VALUES ('apple', 100, false, null),
         ('apple', 200, false, null)
         RETURNING *`)
    testComp = compResult.rows[0];
    testInv1 = invResult.rows[0];
    testInv2 = invResult.rows[1];
});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies, invoices");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /companies", () => {
    test("Gets a list of 1 company", async () => {
        const resp = await request(app)
            .get(`/companies`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            companies: [{ code: testComp.code, name: testComp.name }]
        });
    });
});

describe("GET /companies/:code", () => {
    test("Gets info of specific company", async () => {
        const resp = await request(app)
            .get(`/companies/${testComp.code}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            company: { ...testComp, invoices: [...testInv1, ...testInv2] }
        });
    });

    test("Returns 404 of unknown company", async () => {
        const resp = await request(app)
            .get(`/companies/fail`);
        expect(resp.statusCode).toEqual(404);
    });
});

describe("POST /companies", () => {
    test("Creates a new company", async () => {
        let ibm = { name: 'IBM', description: 'Big blue.' }
        const resp = await request(app)
            .post(`/companies`)
            .send({ ...ibm })
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            company: { ...ibm, code: 'ibm' }
        });
    });
});

describe("PATCH /companies/:code", () => {
    test("Updates a company", async () => {
        const resp = await request(app)
            .patch(`/companies${testComp.code}`)
            .send({ name: "Windows", description: "April fools" });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            company: { code: "apple", name: "Windows", description: "April fools" }
        });
    });

    test("Returns 404 of unknown company", async () => {
        const resp = await request(app)
            .patch(`/companies/fail`)
            .send({ name: "Windows", description: "April fools" });
        expect(resp.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a company", async () => {
        const resp = await request(app)
            .delete(`/companies/${testComp.code}`)
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            status: "deleted"
        });
    });

    test("Returns 404 of unknown company", async () => {
        const resp = await request(app)
            .delete(`/companies/fail`);
        expect(resp.statusCode).toEqual(404);
    });
});