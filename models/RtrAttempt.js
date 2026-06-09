import pool from '../lib/db';

// Lightweight replacement for the old Mongoose model using Postgres.
// Provides `create(obj)` and `find(query)` to match previous usage.
export default {
    async create(obj) {
        const {
            userId,
            mode,
            scenarioId,
            callsign,
            departure,
            destination,
            phases,
            totalScore,
            maxTotalScore,
            percentage,
            passed,
            examinerRemarks,
            duration,
        } = obj;

        const { rows } = await pool.query(
            `INSERT INTO rtr_attempts
                (user_id, mode, scenario_id, callsign, departure, destination, phases, total_score, max_total_score, percentage, passed, examiner_remarks, duration, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
             RETURNING id`,
            [
                userId,
                mode,
                scenarioId,
                callsign,
                departure,
                destination,
                JSON.stringify(phases || []),
                totalScore || 0,
                maxTotalScore || 0,
                percentage || 0,
                passed || false,
                examinerRemarks || '',
                duration || 0,
            ]
        );

        return { _id: rows[0].id.toString() };
    },

    find(query) {
        const userId = query.userId;
        return {
            sort(field) {
                this.sortField = field;
                return this;
            },
            limit(n) {
                this.limitN = n;
                return this;
            },
            async exec() {
                const { rows } = await pool.query(
                    `SELECT id, user_id, mode, scenario_id, callsign, departure, destination, phases, total_score, max_total_score, percentage, passed, examiner_remarks, duration, created_at
                     FROM rtr_attempts
                     WHERE user_id = $1
                     ORDER BY ${this.sortField || 'created_at DESC'}
                     LIMIT $2`,
                    [userId, this.limitN || 10]
                );
                return rows.map(r => ({
                    ...r,
                    _id: r.id.toString(),
                    phases: r.phases,
                }));
            }
        };
    }
};