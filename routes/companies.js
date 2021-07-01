const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get("/", async (req, res, next) => {
    console.log("*****************************************");
    try {
        console.log("before await")
        const results = await db.query(
            `SELECT code, name 
             FROM companies`);
        console.log(results);
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get("/:code", async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT code, name 
             FROM companies 
             WHERE code = $1`,
            [req.params.code]);
        if (result.rows.length === 0) {
            throw new ExpressError('No company found by that code', 404)
        }

        const invsInfo = await db.query(
            `SELECT *
             FROM invoices
             WHERE comp_code = $1`,
            [req.params.code]);
        const compInfo = result.rows[0];
        compInfo['invoices'] = invsInfo.rows[0];

        return res.json({ company: compInfo });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { code, name, description } = req.body;

        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.patch('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const result = await db.query(
            `UPDATE companies 
             SET name=$1, description=$2
             WHERE code=$3
             RETURNING code, name, description`,
            [req.params.code, name, description]
        );

        if (result.rows.length === 0) {
            throw new ExpressError('No company found by that code', 404)
        }
        return res.json({ company: result.rows[0] });

    } catch (err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM companies
             WHERE code=$1
             RETURNING code, name`,
            [req.params.code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError('No company found by that code', 404)
        }
        return res.json({ status: "deleted" })


    } catch (err) {
        return next(err);
    }
});



module.exports = router;