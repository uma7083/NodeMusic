process.env.TMPDIR = 'tmp'; // to avoid the EXDEV rename error, see http://stackoverflow.com/q/21071303/76173

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var flow = require('./flow-node.js')('tmp');

//queue
var queue = require('./routes/queue.js'); 
var routes = require('./routes/index');
var file_upload = require('./routes/file-upload');
//var upload = require('./routes/upload');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));





//	flow.js関連
//  サイズの大きいファイルは複数回に分けて分割して送信する
// Handle uploads through Flow.js
app.post('/upload', multipartMiddleware, function(req, res) {
    flow.post(req, function(status, filename, original_filename, identifier) {
        console.log('POST', status, original_filename, identifier);
        res.send(200, {
            // NOTE: Uncomment this funciton to enable cross-domain request.
            //'Access-Control-Allow-Origin': '*'
        });
    });
});

// Handle cross-domain requests
// NOTE: Uncomment this funciton to enable cross-domain request.
/*
  app.options('/upload', function(req, res){
  console.log('OPTIONS');
  res.send(true, {
  'Access-Control-Allow-Origin': '*'
  }, 200);
  });
*/

// Handle status checks on chunks through Flow.js
app.get('/upload', function(req, res) {
    flow.get(req, function(status, filename, original_filename, identifier) {
        console.log('GET', status);
        res.send(200, (status == 'found' ? 200 : 404));
    });
});

//  tmpディレクトリ以下のファイルを送信 
app.get('/download/:identifier', function(req, res) {
    flow.write(req.params.identifier, res);
});

//	簡易的な app.get app.post は app.use より上の行に書くべき?!
app.use('/', routes);
app.use('/file_upload', file_upload);
//app.use('/upload', upload);





/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

















//----add
//	以下、socket通信を行うために必要な処理
var http = require('http');
var server = http.createServer(app);//	仕様上、http.serverに通してあげないといけない
var io = require('socket.io').listen(server);
server.listen(3000)

//	現在の接続数
var count = 0;

var roomProperty = [];

var chat = io
	.of('/chat')
	.on('connection', function(socket) {
		//	入室と回線切れで++,--なのでフラグが必要
		var enterFlag = false;
		var room = "";
		var name = "";

		//	クライアントに接続成功送信
		socket.emit('connected');

//		console.log(socket);

		//	入室
		socket.on('enter_room', function(req) {
			room = req.room;
			name = req.name;
			chat.to(room).emit('message', req.name + " さんが入室");
			// クライアントを部屋に入室させる
			socket.join(room);
			if (!enterFlag) {
				count++;
				enterFlag = true;
			}
			
			//Aya//部屋管理用のいろいろを新規作成したり更新したり
			if(room in roomProperty)
			{
				roomProperty[room].count += 1;
				
				console.log(roomProperty[room].count + "人部屋に入りました");
			}
			else
			{
				roomProperty[room] =
				{
					count:0,			//部屋にいる人数
					endMusic:0,			//音楽を聴き終わった人数？
					queue:new queue()	//音楽ファイルキュー
				};
				
				roomProperty[room].count += 1;
				
				console.log(roomProperty[room].count + "人部屋に入りました:部屋新規作成");
			}
			
			chat.emit('now_num', {num: count});
			socket.emit('enter_room_res', {result: true})
		});

		//	メッセージ受信->送信
		socket.on('new', function(data) {
			console.log('new', data);
			chat.to(room).emit('new', {text:name + ": " + data.text});
		});

		//Aya//音楽ファイルをキューに追加 roomProperty[room].queueにenqueueするだけ
		socket.on('queue_music', function(data) {
			console.log('queue_music', data);
			roomProperty[room].queue.enqueue(data);
			//chat.to(room).emit('start_music', data);
		});
		
		//Aya//queueから1個取り出してstart_musicする なければ何もしない
		socket.on('next_music', function(){
			var data;
		
			if(!roomProperty[room].queue)
			{
				console.log("noQueue:"+room+", "+name);
				return;
			}
		
			if(data = roomProperty[room].queue.dequeue())
			{
				chat.to(room).emit('start_music', data);
				console.log("dequeue music");
			}
			else
			{
				console.log("queue empty.");
			}
		});

		//	接続切れ
		socket.on('disconnect', function() {
			socket.leave(room);
			chat.to(room).emit('message', name + " さんが退出");
			if (enterFlag) {
				count--;
				enterFlag = false;
			}
			chat.emit('now_num', {num: count});
			console.log('disconnect');
		});
		
		//ここよりAya加筆部分：効果音機能
		socket.on('ring_se', function(data) {
			console.log('ring_se ' + data.seIndex);
			chat.to(room).emit('ring_se', data);
		});
	});
	

module.exports = app;
