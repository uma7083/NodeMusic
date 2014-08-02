//http://keicode.com/script/scr25.php
function Queue() {
	this.__a = new Array();
}

Queue.prototype.enqueue = function(o) {
	this.__a.push(o);
}

Queue.prototype.dequeue = function() {
	if( this.__a.length > 0 ) {
		return this.__a.shift();
	}
	return null;
}

Queue.prototype.size = function() {
	return this.__a.length;
} 

Queue.prototype.toString = function() {
	return '[' + this.__a.join(',') + ']';
}

Queue.prototype.getArray = function(){
	return this.__a;
}

module.exports = Queue;