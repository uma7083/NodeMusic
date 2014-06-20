var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	console.log('getd');
	console.log(req.url);

//	res.sendfile('./public/htmls/file-upload.html'); // load the single view file (angular will handle the page changes on the front-end)
//	res.render('file-upload', { title: 'file-upload'});
	res.render('min-file-upload', { title: 'min-file-upload'});
//	res.render('index', { title: 'Room' });
});
/*
router.post('/', function(req, res) {
	console.log('posted');
	response.contentType('application/json');
	var res = {
		'success' : true,
		'files' : "$_FILES",
		'get' : "$_GET",
		'post' : "$_POST",
		//optional
		'flowTotalSize' : "isset($_FILES['file']) ? $_FILES['file']['size'] : $_GET['flowTotalSize']",
		'flowIdentifier' : "isset($_FILES['file']) ? $_FILES['file']['name'] . '-' . $_FILES['file']['size'] : $_GET['flowIdentifier']",
		'flowFilename' : "isset($_FILES['file']) ? $_FILES['file']['name'] : $_GET['flowFilename']",
		'flowRelativePath' : "isset($_FILES['file']) ? $_FILES['file']['tmp_name'] : $_GET['flowRelativePath']",
	};
	response.json(res);
//	response.send(JSON.stringify(res));
});
*/
module.exports = router;
