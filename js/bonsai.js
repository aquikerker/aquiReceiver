$(function(){
	console.log(myMenu);
	console.log(myMenu.HEAD);
	console.log(myMenu.content);
	console.log(test2);

});

var myMenu = {"HEAD": 'menuList', 
  "content": [{"dishID": 1, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 2, "name": '醬爆牛丸', "price": 99999},
            {"dishID": 3, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 4, "name": '醬爆羊丸', "price": 992119},
            {"dishID": 5, "name": '撒尿羊丸', "price": 20550}, 
            {"dishID": 6, "name": '醬爆豬丸', "price": 9999349},
            {"dishID": 7, "name": '撒尿豬丸', "price": 203440}, 
            {"dishID": 8, "name": '醬爆狗丸', "price": 99999232},
            {"dishID": 9, "name": '撒尿狗丸', "price": 20023}, 
            {"dishID": 10, "name": '醬爆雞丸', "price": 999343499},
            {"dishID": 11, "name": '撒尿雞丸', "price": 44400}, 
            {"dishID": 12, "name": '醬爆貓丸', "price": 9999559},
            {"dishID": 13, "name": '撒尿貓丸', "price": 20340}, 
            {"dishID": 14, "name": '醬爆牛丸', "price": 9999339},
            {"dishID": 15, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 16, "name": '醬爆牛丸', "price": 99999},
            {"dishID": 17, "name": '撒尿牛丸', "price": 200}, 
            {"dishID": 18, "name": '醬爆羊丸', "price": 992119},
            {"dishID": 19, "name": '撒尿羊丸', "price": 20550}, 
            {"dishID": 20, "name": '醬爆豬丸', "price": 9999349},
            {"dishID": 21, "name": '撒尿豬丸', "price": 203440}, 
            {"dishID": 22, "name": '醬爆狗丸', "price": 99999232},
            {"dishID": 23, "name": '撒尿狗丸', "price": 20023}, 
            {"dishID": 24, "name": '醬爆雞丸', "price": 999343499},
            {"dishID": 25, "name": '撒尿雞丸', "price": 44400}, 
            {"dishID": 26, "name": '醬爆貓丸', "price": 9999559},
            {"dishID": 27, "name": '撒尿貓丸', "price": 20340}, 
            {"dishID": 28, "name": '醬爆牛丸', "price": 9999339}]
 };

var test2 = {"HEAD": 'order',
 "tableID": 5,
 "content": [1,2,1,2]
}

//cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);



window.onload = function() {

	//Debugger console
    cast.receiver.logger.setLevelValue(0);

    //castReceiverMeg obj
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

  	window.castReceiverManager.setApplicationState('Aqui 點菜系統！');


    //The channel for customer to order
    // create a CastMessageBus to handle messages for a custom namespace
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
      if(jsonObj.HEAD === 'order'){
      	//appendOrderedDish(jsonObj.tableID, jsonObj.content);
      	appendOrderedDish(1, [10,20,30,40,20,30,20,30]);
      }
    }
    
    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (window.castReceiverManager.getSenders().length == 0) {
	      window.close();
	    }
    };

	//initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
};
  
// utility function to display the text message in the input field
function displayText(text) {
  console.log(text);
  document.getElementById("message").innerHTML=text;
};

function appendOrderedDish(tableID, content){
	//Contert content into {dishID: count...}
	var counted_content = _.countBy(content, function(num) {
	  return num;
	});	
	console.log(counted_content);
	for(var dishID in counted_content){
		var template = _.template($('#orderedQ-template').html(),
						{tableID: tableID, dishID: dishID, count: counted_content[dishID]});
	}
}