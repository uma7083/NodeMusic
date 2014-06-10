var app = angular.module('MainApp', []);

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

	//	メッセージ送信
	$scope.submit = function() {
		$socket.emit('new', {text: $scope.text});
		$scope.text = "";
	};

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
}]);
