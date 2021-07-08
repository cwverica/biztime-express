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

describe("GET /invoices", () => {
    test("Gets a list of 2 invoices", async () => {
        const resp = await request(app)
            .get(`/invoices`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            invoices: [{ id: expect.any(Number), comp_code: testInv1.code }, { id: expect.any(Number), comp_code: testInv2.code }]
        });
    });
});

describe("GET /invoices/:id", () => {
    test("Gets info of specific invoice", async () => {
        delete testInv1['comp_code']
        const resp = await request(app)
            .get(`/invoices/${testInv1.id}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            invoice: { ...testInv1, company: { ...testComp } }
        });
    });

    test("Returns 404 of unknown company", async () => {
        const resp = await request(app)
            .get(`/invoices/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

describe("POST /invoices", () => {
    test("Creates a new invoice", async () => {
        let newInv = { comp_code: 'apple', amt: '300' }
        const resp = await request(app)
            .post(`/invoices`)
            .send({ ...newInv })
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            invoice: { ...newInv, id: expect.any(Number), paid: false, add_date: expect.anything(), paid_date: expect.anything() }
        });
    });
});

describe("PATCH /invoices/:id", () => {
    test("Updates an invoice", async () => {
        const resp = await request(app)
            .patch(`/invoices${testInv1.id}`)
            .send({ amt: 450, paid: false });
        expect(resp.statusCode).toEqual(200);
        let invoice = { ...testInv1 }
        invoice.amt = 450;
        expect(resp.body).toEqual({
            invoice
        });
    });

    test("Returns 404 of unknown invoice", async () => {
        const resp = await request(app)
            .patch(`/invoice/0`)
            .send({ amt: 5 });
        expect(resp.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes an invoice", async () => {
        const resp = await request(app)
            .delete(`/companies/${testInv1.id}`)
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