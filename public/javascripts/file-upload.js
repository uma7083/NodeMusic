var app = app || angular.module('MainApp', ['flow']);

//  ng-flow.jsの使用準備
app.config(['flowFactoryProvider', function (flowFactoryProvider) {
  flowFactoryProvider.defaults = {
    target: '/upload',
    // preprocess: function() {
    //   alert(123);
    // },
    permanentErrors: [404, 500, 501],
    maxChunkRetries: 1,
    //  10MB
    chunkSize: 10 * 1024 * 1024,
    chunkRetryInterval: 5000,
    simultaneousUploads: 4
  };
  flowFactoryProvider.on('catchAll', function (event) {
    console.log('catchAll', arguments);
  });
  // Can be used with different implementations of Flow.js
  // flowFactoryProvider.factory = fustyFlowFactory;
}]);
