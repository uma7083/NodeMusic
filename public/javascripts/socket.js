var app = app || angular.module('MainApp', ['flow']);

//	ChatCtrlでもsocket.ioを使用可能にするために処理
app.factory('$socket', function ($rootScope) {
	console.log('$socket')
	var socket = io.connect('http://' + location.hostname + ':3000/chat');
	return {
	    on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});

//	背景画像指定
app.directive('pageBackground', function() {
    return function (scope, elm, attr) {
        var url = attr.pageBackground;
        elm.css({
            'background': 'url(' + url + ') no-repeat center center fixed',
            '-webkit-background-size': 'cover',
            '-moz-background-size': 'cover',
            '-o-background-size': 'cover',
            'background-size': 'cover'
        });
    };
});

//	チャット用
app.controller("ChatCtrl", ["$scope", "$http", "$socket", function ChatCtrl($scope, $http, $socket) {

	//	部屋にいるかいないかでブラウザの表示が切り替わる
	$scope.isInRoom = false;
	//	デフォルトメッセージ
	$scope.messages = [
		{
			text: "Message Space", 
		},
	];
	console.log('ChatCtrl');

	//	接続人数
	$scope.num = "0";

	//	音楽ファイルキュー配列
	$scope.queue = [];
	$scope.queue.start = function() {
			alert("start");
	};
	$scope.queue.stop = function() {
			alert("stop");
	};
	$scope.queue.info = function() {
			alert("info");
	};

	//	メッセージ送信
	$scope.submit = function() {
		$socket.emit('new', {text: $scope.text});
		$scope.text = "";
	};

	//	任意メッセージ送信
	$scope.submitMessage = function(text) {
		$socket.emit('new', {text: text});
	};

	//	擬似的に末尾の3文字を拡張子として扱う
	$scope.forcedExt = function(fileName) {
		var fileBase = fileName.substr(0, fileName.length-3);
		var fileExt = fileName.substr(-3);
		return fileBase + '.' + fileExt;
	}

	//	音楽キューに追加
	//	arg0	file	ng-flowのファイルオブジェクト
	$scope.addQueue = function(file) {
		$socket.emit('new', {text: "[" + file.name + "]をキューに追加しました。"});
		$socket.emit('new', {text: "DEBUG: uniqueIdentifier:" + file.uniqueIdentifier});
		$socket.emit('new', {text: "DEBUG: size:" + file.size});
		//	音楽をキューに追加
		$socket.emit('queue_music', {
			name: file.name,
			src: $scope.forcedExt(file.uniqueIdentifier),
		});
		//	ファイル情報の破棄
		file.cancel();
	};

	$scope.musicSrc = "";
	$scope.musicName = "";
	$scope.musicAudio = false;
	//	音楽再生開始
	$socket.on('start_music', function(data) {
		$scope.musicName = data.name;
		$scope.musicAudio = true;
		$scope.musicSrc = '/download/' + data.src;
	});

	//	音楽再生開始
	//	現在は未使用
	$socket.on('queue_music', function(data) {
		queue.push(data);
	});

	//	　入室処理
	$scope.roomEnterSubmit = function() {
        $socket.emit('enter_room', { room: $scope.room, name: $scope.name });
		$scope.room = "";
		$scope.name = "";
	};

	//	接続時のコールバック
	$socket.on('connect', function() {
		console.log('connected');
	});

	//	入室完了
	$socket.on('enter_room_res', function(data) {
		console.log('enter_room!');
		$scope.isInRoom = true;
	});

	//	現在の人数
	$socket.on('now_num', function(data) {
		$scope.num = data.num;
	});

	//	メッセージ受け取り
	$socket.on('new', function(data) {
		console.log('new', data)
		$scope.messages.unshift({text: data.text});
	});

	//	用途未決定
	$socket.on('old', function(data) {
		console.log('old', data)
	});

	//	エラー処理
	$socket.on('error', function(e) {
		console.log(String(e))
		});
	
	//Aya//BGMの初期音量が最大なので小さく
	document.getElementById('BGM').volume= 0.2;	
	
	//Aya//効果音機能
	$scope.seList = 
	[
		{ label:" Sn ", src:new Audio("./SE/se_maoudamashii_instruments_drum2_snare-noSilence.mp3")},
		{ label:"H.H", src:new Audio("./SE/se_maoudamashii_instruments_drum2_hat-noSilence.mp3")},
		{ label:"Kick", src:new Audio("./SE/se_maoudamashii_instruments_drum1_bassdrum1-noSilence.mp3")},
		{ label:"Clap", src:new Audio("./SE/Clap01-2-noSilence.mp3")},
		{ label:"Snap", src:new Audio("./SE/Finger Snap01-4-noSilence.mp3")}		
	];
		
	$scope.seList.play = function(index)
	{
		$scope.seList[index].src.currentTime = 0;
		$scope.seList[index].src.play();
	};
	
	$scope.clicked = function(index)
	{	
		$socket.emit('ring_se',{ seIndex:index });
	}
	
	$socket.on('ring_se', function(data){
		$scope.seList.play(data.seIndex);
	});

	//Aya//Queueの次のBGMを再生開始する関数
	$scope.nextMusic = function(){
		$socket.emit('next_music');
	}
	
	
	//Aya//投稿や再生によってキューが更新されたら表示が反映される
	$scope.musicQueue = [];
	
	$socket.on('music_queue_update', function(data) {
		$scope.musicQueue = data;
		console.log("queueUpdate" + data);
	});

}]);
