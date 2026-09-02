/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ExportEngine.js  —  Universal Data Export Engine
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Exports any Mongoose query result / object collection to CSV or JSON formats.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

class ExportEngine {
  /**
   * Send formatted export response over Express res
   *
   * @param {object} res      - Express response
   * @param {Array} data      - Array of records to export
   * @param {string} format   - 'json' or 'csv'
   * @param {string} filename - Output filename base
   */
  static send(res, data = [], format = 'json', filename = 'export') {
    const cleanFormat = (format || 'json').toLowerCase();

    if (cleanFormat === 'csv') {
      const csv = ExportEngine.toCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.csv"`);
      return res.send(csv);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.json"`);
    return res.json(data);
  }

  /**
   * Convert array of objects to CSV string
   */
  static toCSV(data = []) {
    if (!Array.isArray(data) || data.length === 0) return '';

    // Standardize object plain JSON
    const plainDocs = data.map(item => (item.toObject ? item.toObject() : item));
    const headers = Object.keys(plainDocs[0] || {}).filter(k => typeof plainDocs[0][k] !== 'object');

    const headerLine = headers.join(',');
    const rows = plainDocs.map(doc => {
      return headers.map(header => {
        let val = doc[header];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return `"${val}"`;
      }).join(',');
    });

    return [headerLine, ...rows].join('\n');
  }
}

module.exports = ExportEngine;
