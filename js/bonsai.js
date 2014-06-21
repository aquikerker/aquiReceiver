var menu_google_url = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
var orderedList = {}; // {tableID: [{dishid: id, quantity: n}, ...]}
var hotTodayList = {};// {dishid: quantity, ...}
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
      displayText(event.data,'customer');
      console.log('===== Receiver onMessage ========');
      console.log(event);
      console.log('=================================');
      var jsonObj = JSON.parse(event.data);
      console.log(jsonObj);
      switch(jsonObj.HEAD){
      	case 'requestMenu':
      		//var public_url = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
	      	Tabletop.init({
	      		key: menu_google_url,
	      		simpleSheet: true,
	            callback: function(data){
	            	var returnData = {'HEAD': 'menuList', 'content': data};
	            	//Send menu to customer
	      			window.customerBus.send(event.senderId, JSON.stringify(returnData));
	                console.log(data);
	            }
	         });
      		break;

      	case 'order':
      		appendOrderedDish(jsonObj.tableID, jsonObj.content);
	      	if(typeof orderedList[jsonObj.tableID] === 'undefined'){
	      		orderedList[jsonObj.tableID] = [];
	      		console.log('New table in, init the orderedList');
	      	}
	      	//append ordered dishes into orderedList
	      	orderedList[jsonObj.tableID].push.apply(orderedList[jsonObj.tableID], jsonObj.content);
	      	console.log(orderedList[jsonObj.tableID]);

	      	//append ordered dishes into hotTodayList
	      	var counted_content = _.countBy(jsonObj.content,function(num){
	      		return num;
	      	});// {dishid: quantity ...}
			for(var dishID in counted_content){
				if(typeof hotTodayList[dishID] !== 'undefined'){
					hotTodayList[dishID] += counted_content[dishID];
				}
				else{
					hotTodayList[dishID] = counted_content[dishID];					
				}
			}

      		break;

      	case 'requestOrdered':
      		var returnObj = {'HEAD': 'responseOrdered', 'content': []};
      		var mergeContent = _.countBy(orderedList[jsonObj.tableID],function(num){
      			return num;
      		}); // {dishid: quantity ...}
      		
      		var returnContent = _.map(mergeContent, function(quantity, dishid){
      			return {'dishid': parseInt(dishid), 'quantity': quantity};
      		}); // [{dishid: id, quantity: quantity}...]
			returnObj.content = returnContent;
	      	//Send ordered dishes to customer
	      	window.customerBus.send(event.senderId, JSON.stringify(returnObj));
      		/*
      		console.log('===== mergeContent ===========');
      		console.log(mergeContent);
      		console.log('====== returnObj ============');
      		console.log(returnObj);
      		console.log('====== returnContent =========');
      		console.log(returnContent);
      		*/
      		break;
      	case 'HotToday':
      		var returnObj = {'HEAD': 'HotList', 'content': []};
      		var returnContent = [];
      		for (dishid in hotTodayList){
      			var contentEl = {};
      			contentEl.dishid = dishid;
      			contentEl.quantity = hotTodayList[dishid];
      			returnContent.push(contentEl);
      		}
      		// Sort by quantity;
      		returnContent.sort(function(a,b){
      			return b.quantity - a.quantity;
      		});
			returnObj.content = returnContent;
			//Send today hot list to customer
			window.customerBus.send(event.senderId, JSON.stringify(returnObj));      		
			
      		/*
      		console.log('====== returnContent sorted =========== ');
      		console.log(returnContent);
			*/
      		break;	
      	default:
      		console.warn('unknown request HEAD!!');
      }
    }

   	//@The channel for customer to order
    //@create a CastMessageBus to handle messages for a custom namespace
    window.adminBus = 
    	window.castReceiverManager.getCastMessageBus('urn:x-cast:aqui-diarrhea');

	//@handler for the CastMessageBus message event [admin]
    adminBus.onMessage = function(event){
      	displayText(event.data,'admin');

    	var jsonObj = JSON.parse(event.data);
    	switch(jsonObj.HEAD){
    		case 'setMenuUrl':
	    		Tabletop.init({ key: public_url,
						simpleSheet: true,
		             	callback: function(data){
		             		console.log(data);
		        		}
		        });
	    		menu_google_url = jsonObj.url;
    			break;
    	}
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
  "content": [{"dishid": 1, "name": '超級宇宙戰艦霹靂無敵撒尿牛丸', "price": 200}, 
            {"dishid": 2, "name": '超級宇宙戰艦無敵醬爆牛丸', "price": 99999},
            {"dishid": 3, "name": '超級宇宙戰艦無敵撒尿牛丸', "price": 200}, 
            {"dishid": 4, "name": '超級宇宙戰艦無敵醬爆羊丸', "price": 992119},
            {"dishid": 5, "name": '超級宇宙戰艦無敵撒尿羊丸', "price": 20550}, 
            {"dishid": 6, "name": '醬爆豬丸', "price": 9999349},
            {"dishid": 7, "name": '撒尿豬丸', "price": 203440}, 
            {"dishid": 8, "name": '醬爆狗丸', "price": 99999232},
            {"dishid": 9, "name": '撒尿狗丸', "price": 20023}, 
            {"dishid": 10, "name": '醬爆雞丸', "price": 999343499},
            {"dishid": 11, "name": '撒尿雞丸', "price": 44400}, 
            {"dishid": 12, "name": '醬爆貓丸', "price": 9999559},
            {"dishid": 13, "name": '撒尿貓丸', "price": 20340}, 
            {"dishid": 14, "name": '醬爆牛丸', "price": 9999339},
            {"dishid": 15, "name": '撒尿牛丸', "price": 200}, 
            {"dishid": 16, "name": '醬爆牛丸', "price": 99999},
            {"dishid": 17, "name": '撒尿牛丸', "price": 200}, 
            {"dishid": 18, "name": '醬爆羊丸', "price": 992119},
            {"dishid": 19, "name": '撒尿羊丸', "price": 20550}, 
            {"dishid": 20, "name": '醬爆豬丸', "price": 9999349},
            {"dishid": 21, "name": '撒尿豬丸', "price": 203440}, 
            {"dishid": 22, "name": '醬爆狗丸', "price": 99999232},
            {"dishid": 23, "name": '撒尿狗丸', "price": 20023}, 
            {"dishid": 24, "name": '醬爆雞丸', "price": 999343499},
            {"dishid": 25, "name": '撒尿雞丸', "price": 44400}, 
            {"dishid": 26, "name": '醬爆貓丸', "price": 9999559},
            {"dishid": 27, "name": '撒尿貓丸', "price": 20340}, 
            {"dishid": 28, "name": '醬爆牛丸', "price": 9999339}]
 };


// utility function to display the text message in the input field
function displayText(text,target) {
  console.log(text);
  switch(target){
  	case 'customer':
  		$('#message_customer').html(text);
  		break;
  	case 'admin':
  		$('#message_admin').html(text);
  		break;	
  }
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