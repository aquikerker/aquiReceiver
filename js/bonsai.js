$(function(){
	//Debugger console
    cast.receiver.logger.setLevelValue(0);

    //castReceiverMeg obj
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

  	window.castReceiverManager.setApplicationState('Aqui 點菜系統！');
  
    //@handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
      console.log('Received Ready event: ' + JSON.stringify(event.data));
      window.castReceiverManager.setApplicationState("Application status is ready...");
    };
    
    //@handler for 'senderConnected' event
    castReceiverManager.onSenderConnected = function(event) {
      console.log('Received Sender Connected event: ' + event.data);
      console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };

   	//@The channel for customer to order
    //@create a CastMessageBus to handle messages for a custom namespace
    window.customerBus = 
    	window.castReceiverManager.getCastMessageBus('urn:x-cast:aqui-bonsai:customer');
   
	//@handler for the CastMessageBus message event [customer]
    customerBus.onMessage = function(event) {
      displayText(event.data);
      console.log('===== Receiver onMessage ========');
      console.log(event);
      console.log('=================================');
      var jsonObj = JSON.parse(event.data);
      console.log(jsonObj);
      if(jsonObj.HEAD === 'requestMenu'){
      	var public_url = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
      	Tabletop.init({ key: public_url,
      					 simpleSheet: true,
                         callback: function(data){
      						window.customerBus.send(event.senderId, JSON.stringify(myMenu));
                         	console.log(data);
                         }
                      });
//      	window.customerBus.send(event.senderId, JSON.stringify(myMenu));
      }
      if(jsonObj.HEAD === 'order'){
      	appendOrderedDish(jsonObj.tableID, jsonObj.content);
      }
    }

   	//@The channel for customer to order
    //@create a CastMessageBus to handle messages for a custom namespace
    window.adminBus = 
    	window.castReceiverManager.getCastMessageBus('urn:x-cast:aqui-bonsai:administrator');

	//@handler for the CastMessageBus message event [admin]
    adminBus.onMessage = function(event){

    }

	//initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
    
    //@handler for 'senderDisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (window.castReceiverManager.getSenders().length == 0) {
	      window.close();
	    }
    };
});

var myMenu = {"HEAD": 'menuList', 
  "content": [{"dish_id": 1, "name": '超級宇宙戰艦霹靂無敵撒尿牛丸', "price": 200}, 
            {"dish_id": 2, "name": '超級宇宙戰艦無敵醬爆牛丸', "price": 99999},
            {"dish_id": 3, "name": '超級宇宙戰艦無敵撒尿牛丸', "price": 200}, 
            {"dish_id": 4, "name": '超級宇宙戰艦無敵醬爆羊丸', "price": 992119},
            {"dish_id": 5, "name": '超級宇宙戰艦無敵撒尿羊丸', "price": 20550}, 
            {"dish_id": 6, "name": '醬爆豬丸', "price": 9999349},
            {"dish_id": 7, "name": '撒尿豬丸', "price": 203440}, 
            {"dish_id": 8, "name": '醬爆狗丸', "price": 99999232},
            {"dish_id": 9, "name": '撒尿狗丸', "price": 20023}, 
            {"dish_id": 10, "name": '醬爆雞丸', "price": 999343499},
            {"dish_id": 11, "name": '撒尿雞丸', "price": 44400}, 
            {"dish_id": 12, "name": '醬爆貓丸', "price": 9999559},
            {"dish_id": 13, "name": '撒尿貓丸', "price": 20340}, 
            {"dish_id": 14, "name": '醬爆牛丸', "price": 9999339},
            {"dish_id": 15, "name": '撒尿牛丸', "price": 200}, 
            {"dish_id": 16, "name": '醬爆牛丸', "price": 99999},
            {"dish_id": 17, "name": '撒尿牛丸', "price": 200}, 
            {"dish_id": 18, "name": '醬爆羊丸', "price": 992119},
            {"dish_id": 19, "name": '撒尿羊丸', "price": 20550}, 
            {"dish_id": 20, "name": '醬爆豬丸', "price": 9999349},
            {"dish_id": 21, "name": '撒尿豬丸', "price": 203440}, 
            {"dish_id": 22, "name": '醬爆狗丸', "price": 99999232},
            {"dish_id": 23, "name": '撒尿狗丸', "price": 20023}, 
            {"dish_id": 24, "name": '醬爆雞丸', "price": 999343499},
            {"dish_id": 25, "name": '撒尿雞丸', "price": 44400}, 
            {"dish_id": 26, "name": '醬爆貓丸', "price": 9999559},
            {"dish_id": 27, "name": '撒尿貓丸', "price": 20340}, 
            {"dish_id": 28, "name": '醬爆牛丸', "price": 9999339}]
 };

var test2 = {"HEAD": 'order',
 "tableID": 5,
 "content": [1,2,1,2]
}

// utility function to display the text message in the input field
function displayText(text) {
  console.log(text);
  $('#message').html(text);
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
		$('#orderedQ').append(template);
	}
}