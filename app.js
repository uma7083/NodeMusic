var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var routes = require('./routes/index');

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

app.use('/', routes);

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

var chat = io
	.of('/chat')
	.on('connection', function(socket) {
		//	入室と回線切れで++,--なのでフラグが必要
		var enterFlag = false;
		var room = "";
		var name = "";
		//	クライアントに接続成功送信
		socket.emit('connected');

		console.log(socket);

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
			chat.emit('now_num', {num: count});
			socket.emit('enter_room_res', {result: true})
		});

		//	メッセージ受信->送信
		socket.on('new', function(data) {
			console.log('message', data);
			chat.to(room).emit('new', {text:name + ": " + data.text});
		});

		//	接続切れ
		socket.on('disconnect', function() {
			var room, name;

			socket.get('room', function(err, _room) {
				room = _room;
			});
			socket.get('name', function(err, _name) {
				name = _name;
			});
			socket.leave(room);
			chat.to(room).emit('message', name + " さんが退出");
			if (enterFlag) {
				count--;
				enterFlag = false;
			}
			chat.emit('now_num', {num: count});
			console.log('disconnect');
		});
	});

module.exports = app;
