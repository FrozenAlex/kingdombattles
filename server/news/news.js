/**
 * A file to manage all news
 */
//libraries
let fs = require('fs');
let path = require('path');
let firstline = require('firstline');

var express = require('express')
var router = express.Router();

let BaseDir = path.join(__dirname, '..', '..','content','news');

let { log } = require('../../common/utilities.js');

router.get('/', newsRequest);
router.post('/', newsRequest);
router.get('/headers', newsHeadersRequest);
router.post('/headers', newsHeadersRequest);
// router.post('/tag/', newsHeadersRequest);
// router.post('/article/:article', newsHeadersRequest);

async function newsRequest(req, res) {
	let fileNames = fs.readdirSync(BaseDir);

	//if it's one specific post
	if (req.body.postId) {
		if (!fileNames.includes(req.body.postId)) {
			res.status(404).write('File Not Found');
			res.end();
			return;
		}

		let json = {};
		json[req.body.postId] = fs.readFileSync(path.join(BaseDir, req.body.postId), 'utf8');
		res.status(200).json(json);
		res.end();

		log('News sent (singular)', req.body.postId, JSON.stringify(json));
		return;
	}

	//set the maximum
	let max = parseInt(req.body.length) || 99;
	if (isNaN(max) || max > fileNames.length) {
		max = fileNames.length;
	}

	//build the object to send
	let json = {}; //TODO: caching

	//send each file as json
	for (let i = 0; i < max; i++) {
		json[fileNames[fileNames.length - i - 1]] = fs.readFileSync(path.join(BaseDir, fileNames[fileNames.length - i - 1]), 'utf8');
	}

	//actually send the data
	res.status(200).json(json);
	res.end();

	log('News sent', max, fileNames, JSON.stringify(json));
};

async function newsHeadersRequest(req, res) {
	let fileNames = fs.readdirSync(BaseDir);

	let json = {};

	let promises = [];

	for (let i = 0; i < fileNames.length; i++) {
		promises.push(firstline(path.join(BaseDir, fileNames[i])).then(fl => json[fileNames[i]] = {
			firstline: fl
		}));
	}

	Promise.all(promises)
		.then(() => {
			res.status(200).json(json);
			res.end();

			log('News headers sent', fileNames.length);
		});
}

module.exports = router;