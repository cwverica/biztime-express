const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT id, comp_code 
             FROM invoices`);
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
        const { amt, paid } = req.body;

        const currInv = await db.query(
            `SELECT paid
             FROM invoices
             WHERE id = $1`,
            [req.params.id]);

        if (currInv.rows.length === 0) {
            throw new ExpressError('No invoice found by that id', 404)
        }

        let paidDate = null;
        const curPaidDate = currInv.rows[0].paid_date;

        if (!curPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = curPaidDate;
        }

        const result = await db.query(
            `UPDATE invoices 
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, req.params.id]
        );


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