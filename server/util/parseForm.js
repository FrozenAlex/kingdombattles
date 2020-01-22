/**
 * Formidable async wrapper
 */
let formidable = require('formidable');

/**
 * Async express form parser function
 * @param {Express.Request} req Express request
 * @param {*} opts Formidable options
 */
function parseForm(req,opts) {
    return new Promise(function (resolve, reject) {
        var form = new formidable.IncomingForm(opts)
        form.parse(req, function (err, fields, files) {
          if (err) return reject(err)
          resolve({ fields: fields, files: files })
        })
      })
}

module.exports = parseForm;