//var menu_google_key = '';
var menu_google_key = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
var orderedList = {}; // {tableNum: [{dishid: id, quantity: n}, ...],...}
var hotTodayList = {};// {dishid: quantity, ...}
var statusName = 'Quick Order Oh!';
var adminIDList = []; // connecting admin ID list
var customerIDList = []; // connecting customer ID list
var menuContent = NaN;

$(function(){
	//Debugger console
    cast.receiver.logger.setLevelValue(0);

    //castReceiverMeg obj
    var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

  	castReceiverManager.setApplicationState('Aqui hahaha！');
  
    //@handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
      console.log('Received Ready event: ' + JSON.stringify(event.data));
      castReceiverManager.setApplicationState(statusName);
    
    };
    
    //@handler for 'senderConnected' event
    castReceiverManager.onSenderConnected = function(event) {
      console.log('Received Sender Connected event: ' + event.data);
      console.log(castReceiverManager.getSender(event.data).userAgent);
    };

   	//@The channel for customer to order
    //@create a CastMessageBus to handle messages for a custom namespace
    var customerBus = castReceiverManager.getCastMessageBus('urn:x-cast:aqui-bonsai');
   
	//@handler for the CastMessageBus message event [customer]
    customerBus.onMessage = function(event) {
	    displayText(event.data,'customer');
	    var jsonObj = JSON.parse(event.data);
	    console.log(jsonObj);
		switch(jsonObj.HEAD){
	  	case 'handShaking':
			// Kick out the costomer if menu not set		
	  		if (menu_google_key === ''){
	  			console.log('There is no menu, plz get out!');
	  			var returnData = {'HEAD': 'ErrorMsg', 'content': 'noMenu'};
	      		customerBus.send(event.senderId, JSON.stringify(returnData));

	  		}
	  		// Add the customer ID into list
	  		else{
		  		customerIDList.push(event.senderId);
		  		console.log('=== current customerIDList ===');
		  		console.log(customerIDList);	
	  		}
	  		break;
	  	case 'requestMenu':
	  		if(menuContent == NaN){
	  			Tabletop.init({
		      		key: menu_google_key,
		      		simpleSheet: true,
		      		debug: true,
		            callback: function(data){
		            	menuContent = data;
		            	var returnData = {'HEAD': 'menuList', 'content': menuContent};
		            	//Send menu to customer
		      			customerBus.send(event.senderId, JSON.stringify(returnData));
		                console.log('Get menu from google doc');
		                console.log(menuContent);
		            }		
		        });	
	  		}
	  		else{
	  			var returnData = {'HEAD': 'menuList', 'content': menuContent};
            	//Send menu to customer
      			customerBus.send(event.senderId, JSON.stringify(returnData));
      			console.log('Return menu directly');
		        console.log(menuContent);

	  		}	      	  	
	  		break;
	  	case 'order':
	  		appendOrderedDish(jsonObj.tableNum, jsonObj.content);
	      	if(typeof orderedList[jsonObj.tableNum] === 'undefined'){
	      		orderedList[jsonObj.tableNum] = [];
	      		console.log('New table in, init the orderedList');
	      	}
	      	//append ordered dishes into orderedList
	      	orderedList[jsonObj.tableNum].push.apply(orderedList[jsonObj.tableNum], jsonObj.content);
	      	console.log(orderedList[jsonObj.tableNum]);

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
	  		var mergeContent = _.countBy(orderedList[jsonObj.tableNum],function(num){
	  			return num;
	  		}); // {dishid: quantity ...}
	  		
	  		var returnContent = _.map(mergeContent, function(quantity, dishid){
	  			return {'dishid': parseInt(dishid), 'quantity': quantity};
	  		}); // [{dishid: id, quantity: quantity}...]
			returnObj.content = returnContent;
	      	//Send ordered dishes to customer
	      	customerBus.send(event.senderId, JSON.stringify(returnObj));
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
	  			contentEl.dishid = parseInt(dishid);
	  			contentEl.quantity = hotTodayList[dishid];
	  			returnContent.push(contentEl);
	  		}
	  		// Sort by quantity;
	  		returnContent.sort(function(a,b){
	  			return b.quantity - a.quantity;
	  		});
			returnObj.content = returnContent;
			//Send today hot list to customer
			customerBus.send(event.senderId, JSON.stringify(returnObj));      		

	  		/*
	  		console.log('====== returnContent sorted =========== ');
	  		console.log(returnContent);
			*/
	  		break;	
	  	default:
	  		console.warn('[customer]:unknown request HEAD!!');
	  		break;
		}     	
    }

   	//@The channel for admin
    //@create a CastMessageBus to handle messages for a admin namespace
    var adminBus = castReceiverManager.getCastMessageBus('urn:x-cast:aqui-diarrhea');

	//@handler for the CastMessageBus message event [admin]
    adminBus.onMessage = function(event){
      	displayText(event.data,'admin');

    	var jsonObj = JSON.parse(event.data);
    	switch(jsonObj.HEAD){
    		case 'handShaking':
    			adminIDList.push(event.senderId);
    			console.log('=== current adminIDList ===');
    			console.log(adminIDList);
    			break;
    		case 'setMenuUrl':
    			menu_google_key = jsonObj.url;
	    		/*Tabletop.init({ key: menu_google_key,
						simpleSheet: true,
		             	callback: function(data){
		             		console.log(data);
		        		}
		        });*/
    			break;
    		case 'clearOrderOneRow':
    			$("#orderedQ").find('tr:nth-child(1)').remove();
    			break;
    		default:
    			console.warn('[admin]:unknown request HEAD!!');
    			break;
    	}
    }

  	//@handler for 'senderDisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (castReceiverManager.getSenders().length == 0) {
	      window.close();
	    }
	  // clear the connected list
      var disconnectedID = event.senderId;	
	  /*
	  console.log('sender ID [ ' + disconnectedID + ' ] has disconnected');
	  console.log(customerIDList);
	  console.log(_.indexOf(customerIDList,disconnectedID));*/
	  if(_.indexOf(adminIDList,disconnectedID) >= 0){
	  	adminIDList.splice(_.indexOf(adminIDList,disconnectedID),1);
	  	console.log('It is an admin');
	  	console.log(adminIDList);
	  }
	  if(_.indexOf(customerIDList,disconnectedID) >= 0){
	  	customerIDList.splice(_.indexOf(customerIDList,disconnectedID),1);
	  	console.log('it is a customer')
	  	console.log(customerIDList);
	  }	  
    };

	//initialize the CastReceiverManager with an application status message
    castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
    
});

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

function appendOrderedDish(tableNum, content){
	//Contert content into {dishID: count...}
	var counted_content = _.countBy(content, function(num) {
	  return num;
	});	
	console.log(counted_content);
	for(var dishID in counted_content){
		var template = _.template($('#orderedQ-template').html(),
						{tableNum: tableNum, dishID: dishID, count: counted_content[dishID]});
		$('#orderedQ').append(template);
	}
}
