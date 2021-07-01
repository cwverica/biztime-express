const express = require("express");
const router = new express.Router();
const db = require("../db");


router.get("/", async (req, res, next) => {
    console.log("*****************************************");
    try {
        console.log("before await")
        const results = await db.query(
            `SELECT id, comp_code 
             FROM invoices`);
        console.log(results);
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT * 
             FROM invoices
             WHERE id = $1`,
            [req.params.id]);
        if (result.rows.length === 0) {
            throw new ExpressError('No invoice found by that id', 404)
        }
        const compInfo = await db.query(
            `SELECT *
            FROM companies
            WHERE code = $1`,
            [results.row[0]['comp_code']]);

        const invoice = result.rows[0];
        delete invoice['comp_code'];
        invoice['company'] = compInfo.rows[0];
        return res.json({ invoice });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const { amt } = req.body;

        const result = await db.query(
            `UPDATE invoices 
             SET amt=$1
             WHERE id=$3
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.params.id, amt]
        );

        if (result.rows.length === 0) {
            throw new ExpressError('No invoice found by that id', 404)
        }
        return res.json({ invoice: result.rows[0] });

    } catch (err) {
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM invoices
             WHERE id=$1
             RETURNING id, amt`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError('No invoice found by that id', 404)
        }
        return res.json({ status: "deleted" })


    } catch (err) {
        return next(err);
    }
});




module.exports = router;