$(function(){
	console.log(myMenu);
	console.log(myMenu.HEAD);
	console.log(myMenu.content);
	console.log(test2);

});

var myMenu = {"HEAD": 'menuList', 
  "content": [{"dishID": 1, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 2, "name": '醬爆牛丸', "price": 99999},
            {"dishID": 1, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 2, "name": '醬爆羊丸', "price": 992119},
            {"dishID": 1, "name": '撒尿羊丸', "price": 20550}, 
            {"dishID": 2, "name": '醬爆豬丸', "price": 9999349},
            {"dishID": 1, "name": '撒尿豬丸', "price": 203440}, 
            {"dishID": 2, "name": '醬爆狗丸', "price": 99999232},
            {"dishID": 1, "name": '撒尿狗丸', "price": 20023}, 
            {"dishID": 2, "name": '醬爆雞丸', "price": 999343499},
            {"dishID": 1, "name": '撒尿雞丸', "price": 44400}, 
            {"dishID": 2, "name": '醬爆貓丸', "price": 9999559},
            {"dishID": 1, "name": '撒尿貓丸', "price": 20340}, 
            {"dishID": 2, "name": '醬爆牛丸', "price": 9999339},
            {"dishID": 1, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 2, "name": '醬爆牛丸', "price": 99999},
            {"dishID": 1, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 2, "name": '醬爆羊丸', "price": 992119},
            {"dishID": 1, "name": '撒尿羊丸', "price": 20550}, 
            {"dishID": 2, "name": '醬爆豬丸', "price": 9999349},
            {"dishID": 1, "name": '撒尿豬丸', "price": 203440}, 
            {"dishID": 2, "name": '醬爆狗丸', "price": 99999232},
            {"dishID": 1, "name": '撒尿狗丸', "price": 20023}, 
            {"dishID": 2, "name": '醬爆雞丸', "price": 999343499},
            {"dishID": 1, "name": '撒尿雞丸', "price": 44400}, 
            {"dishID": 2, "name": '醬爆貓丸', "price": 9999559},
            {"dishID": 1, "name": '撒尿貓丸', "price": 20340}, 
            {"dishID": 2, "name": '醬爆牛丸', "price": 9999339}]
 };

var test2 = {"HEAD": 'order',
 "tableID": 5,
 "content": [1,2]
}

//cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);


window.onload = function() {
    cast.receiver.logger.setLevelValue(0);

    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

    //The channel for customer to order
    window.customerBus = 
    	window.castReceiverManager.getCastMessageBus('urn:x-cast:aqui-bonsai:customer');

    
    // handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
      console.log('Received Ready event: ' + JSON.stringify(event.data));
      window.castReceiverManager.setApplicationState("Application status is ready...");
    };
    
    // handler for 'senderconnected' event
    castReceiverManager.onSenderConnected = function(event) {
      console.log('Received Sender Connected event: ' + event.data);
      console.log(window.castReceiverManager.getSender(event.data).userAgent);
      //var new_comes_senderId = window.castReceiverManager.getSender(event.data).senderId;
      //var new_comes_senderId = window.castReceiverManager.getSender(event.data).id;
      //cast.receiver.CastMessageBus.send(new_comes_senderId,myMenu);
      //window.customerBus.send(new_comes_senderId, myMenu);

    };

	// handler for the CastMessageBus message event
    window.customerBus.onMessage = function(event) {
      displayText(event.data);
      console.log('===== Receiver onMessage ========');
      console.log(event);
      console.log('=================================');
      var jsonObj = JSON.parse(event.data);
      console.log(jsonObj);
      if(jsonObj.HEAD === 'requestMenu'){
      	window.customerBus.send(event.senderId, JSON.stringify(myMenu));
      }
    }
    
    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (window.castReceiverManager.getSenders().length == 0) {
      window.close();
    }
    };
    
    // handler for 'systemvolumechanged' event
    /*
    castReceiverManager.onSystemVolumeChanged = function(event) {
      console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' +
          event.data['muted']);
    };*/

    // create a CastMessageBus to handle messages for a custom namespace
    /*
    window.messageBus = 
    	window.castReceiverManager.getCastMessageBus('urn:x-cast:com.google.cast.sample.helloworld');

    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function(event) {
      console.log('Message [' + event.senderId + ']: ' + event.data);
      // display the message from the sender
      displayText(event.data);
      // inform all senders on the CastMessageBus of the incoming message event
      // sender message listener will be invoked
      window.messageBus.send(event.senderId, event.data);
    }*/


	


// initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');

};
  
  // utility function to display the text message in the input field
  function displayText(text) {
    console.log(text);
    document.getElementById("message").innerHTML=text;
    window.castReceiverManager.setApplicationState(text);
  };