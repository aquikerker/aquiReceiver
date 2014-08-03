//var menu_google_key = '';
var menu_google_key = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
var orderedList = {}; // {tableNum: [{dishid: id, quantity: n}, ...],...}
var hotTodayList = {};// {dishid: quantity, ...}
var statusName = 'Quick Order Oh!';
var adminIDList = []; // connecting admin ID list
var customerIDList = []; // connecting customer ID list
var menuContent = null;
var dishID_dishNameMap = {} // {dishID: dishName,...}
var totalAvaTable = null;
var occupiedTable = [];


$(function(){
   //Testing!
    testFeatures();

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
	  		if(menuContent == null){
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
		            	//init the dishID_dishNameMap
		            	if(_.isEmpty(dishID_dishNameMap)){
			            	for(var i=0; i < menuContent.length; i++){
			            		var eachDish = menuContent[i];
			            		console.log(eachDish);
			            		dishID_dishNameMap[parseInt(eachDish.dishid)] = eachDish.name;
			            	}
			            	console.log(dishID_dishNameMap);	
		            	}
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
	  	case 'setTableNum':
	  			var TNum = parseInt(jsonObj.content);
	  			if (totalAvaTable === null){
	  				customerBus.send(event.senderId, JSON.stringify({ // Admin haven't set
	      				'HEAD': 'ErrorMsg',
	      				'content': 'noTableAmount'})
	      			);
	  			}
	  			else if( TNum > totalAvaTable || TNum <= 0){ // Input Error
	      			customerBus.send(event.senderId, JSON.stringify({
	      				'HEAD': 'ErrorMsg',
	      				'content': 'tableNumberError'})
	      			);	  				
	  			}
	  			else{ // Success
				  	customerBus.send(event.senderId, JSON.stringify({
	      				'HEAD': 'tableNumOK'})
	      			);
	      			occupiedTable.push(TNum);
	      			ntfController.newCustomer();		
	  			}
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
   		  	case 'scrollPage':
   		  		var currentY = $(window).scrollTop();
				if(jsonObj.direction === 'up'){
    				$("html, body").animate({ scrollTop: currentY - 400 }, 500);
				}
				else if(jsonObj.direction === 'down'){
    				$("html, body").animate({ scrollTop: currentY + 400 }, 500);
				}
	  			break;
	  		case 'changeView':
	  			if(jsonObj.content === 'orderList'){
    				changeView.orderedListView();
	  			}
	  			else if(jsonObj.content === 'tableStatus'){
    				changeView.tableStatusView();
	  			}
	  			break;
	  		case 'TableAmount':
	  			totalAvaTable = parseInt(jsonObj.content);
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
						{tableNum: tableNum, 
							dishID: dishID, 
							dishName: dishID_dishNameMap[dishID], 
							count: counted_content[dishID]
						});
		$('#orderedQ').append(template);
	}
}

var changeView = {
	tableStatusView: function(){
		$('#orderedList-view-container').hide();
		$('#table-view-container').show();
		$('#view-title-container .view-title').each(function(i,el){
			console.log(this);
			if( $(this).attr('_data') === 'tableStatus' ){
				$(this).addClass('selected');
			}
			else{
				$(this).removeClass('selected');
			}
		});
	},
	orderedListView: function(){
		$('#table-view-container').hide();
		$('#orderedList-view-container').show();
		$('#view-title-container .view-title').each(function(i,el){
			if( $(this).attr('_data') === 'orderedList' ){
				$(this).addClass('selected');
			}
			else{
				$(this).removeClass('selected');
			}
		});
	}
}

var ntfController = {
	newCustomer: function(){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: iconType.newCustomer,
			textContent: '人客來囉！'
		})
		$(tmp).appendTo('#notification-container').delay(5000).fadeOut(function(){$(this).remove()});		
	},
	newOrder: function(tableNum, dishid){

	},
	callWaiter: function(tableNum){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: iconType.callWaiter,
			textContent: '<highlight>' + tableNum +'號桌</highlight>呼叫服務生！'
		});
		$(tmp).appendTo('#notification-container').delay(5000).fadeOut(function(){$(this).remove()});
	}
}

function testFeatures(){
	// Testing notification window!
	var iconType = {callWaiter: 'fa-bell', newCustomer: 'fa-child', newOrder: 'fa-list-alt'};

	$('#show-alert-btn').on('click',function(){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: iconType.callWaiter,
			textContent: '<highlight>7號桌</highlight>呼叫服務生！'
		});
		$(tmp).appendTo('#notification-container').delay(5000).fadeOut(function(){$(this).remove()});
	});
	$('#show-alert-btn2').on('click',function(){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: iconType.newOrder,
			textContent: '<highlight>7號桌</highlight>點了黯然銷魂飯！'
		});
		$(tmp).appendTo('#notification-container').delay(5000).fadeOut(function(){$(this).remove()});
	});
	$('#show-alert-btn3').on('click',function(){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: iconType.newCustomer,
			textContent: '人客來囉！'
		})
		$(tmp).appendTo('#notification-container').delay(5000).fadeOut(function(){$(this).remove()});

	});

	/*
	var counter = new Date(0);
	var clock = $('.flipclock-container').FlipClock({
		clockFace: 'MinuteCounter'
	});	
	/*var clock2 = $('.flipclock-container2').FlipClock({
		clockFace: 'MinuteCounter'
	});*/
	var clock2 = $('.flipclock-container2').countdown({since: new Date(), 
    format: 'HMS'});
    var clock1 = $('.flipclock-container').countdown({since: new Date(), 
    format: 'HMS'});

    $('#scroll-up-btn').on('click',function(){
    	var y = $(window).scrollTop();
    	$("html, body").animate({ scrollTop: y - 300 }, 600);
    });

    $('#change-tablStatus-btn').on('click',function(){
    	changeView.tableStatusView();
    });
    $('#change-orderedList-btn').on('click',function(){
    	changeView.orderedListView();
    })
}
