var menu_google_key = '';
//var menu_google_key = '1W0sGR3uKt5Qc6D79ksnB33swJzbP_eaq-6gDgCrbxLs';
var orderedList = {}; // {tableNum: [dishid,],...}
var orderedList_pendingCount = {}; // {tableNum: Count,...}
var hotTodayList = {};// {dishid: quantity, ...}
var statusName = 'Quick Order Oh!';
var adminIDList = []; // connecting admin ID list
var customerIDList = []; // connecting customer ID list
var menuContent = null;
var dishID_dishNameMap = {} // {dishID: dishName,...}
var dishID_priceMap = {} // {dishID: dollars,...}
//var dishID_dishNameMap = {1: '黯然銷魂飯', 2: '新竹米粉攤'} // For testing
//var totalAvaTable = null;
var totalAvaTable = 20; // For testing
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

   	//@The channel for admin
    //@create a CastMessageBus to handle messages for a admin namespace
    var adminBus = castReceiverManager.getCastMessageBus('urn:x-cast:aqui-diarrhea');

   
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
		            	//init the dishID_dishNameMap & dishID_priceMap
		            	if(_.isEmpty(dishID_dishNameMap) || _.isEmpty(dishID_priceMap)){
			            	for(var i=0; i < menuContent.length; i++){
			            		var eachDish = menuContent[i];
			            		console.log(eachDish);
			            		dishID_dishNameMap[parseInt(eachDish.dishid)] = eachDish.name;
			            		dishID_priceMap[parseInt(eachDish.dishid)] = eachDish.price;
			            	}
			            	console.log(dishID_dishNameMap);	
			            	console.log(dishID_priceMap);	
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
	  		var tableID = jsonObj.tableNum;
	  		if(jsonObj.content.length > 0){ //prevent empty order
	  			appendOrderedDish(tableID, jsonObj.content);

		  		// Add ordered item to orderedList
		      	if(typeof orderedList[tableID] === 'undefined'){
		      		orderedList[tableID] = [];
		      		console.log('New table in, init the orderedList');
		      	}
		      	orderedList[tableID].push.apply(orderedList[tableID], jsonObj.content);
		      	console.log(orderedList[tableID]);
				
		      	// Add ordered items to orderedList_pendingCount
		      	if(typeof orderedList_pendingCount[tableID] === 'undefined'){
		      		orderedList_pendingCount[tableID] = 0;
	    			tableStatusController.turnOnLight(tableID,'newOrder');
	    			tableStatusController.startTimeCounter(tableID);
		      	}
		      	orderedList_pendingCount[tableID] += jsonObj.content.length;
		      	console.log('orderedList_pendingCount, tableID = '+ tableID+ ' Count: ' + orderedList_pendingCount[tableID]);

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
				ntfController.newOrder(tableID, jsonObj.content);
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
  			else if( occupiedTable.indexOf(TNum) >= 0 ){ // TNum duplicated => others in the same table
  				customerBus.send(event.senderId, JSON.stringify({
      				'HEAD': 'tableNumOK'})
      			);
  			}
  			else{ // Success
			  	customerBus.send(event.senderId, JSON.stringify({
      				'HEAD': 'tableNumOK'})
      			);
      			occupiedTable.push(TNum);
      			// Resend occupiedTable
      			for(var i=0; i< adminIDList.length; i++){
      				console.log('====== newCustomer , resend occupiedTable!!! ======');
      				adminBus.send(adminIDList[i], JSON.stringify({
	      				'HEAD': 'occupiedTable',
	      				'content': [TNum]})
	      			);
      			}
      			ntfController.newCustomer();
      			tableStatusController.occupyTable(TNum);	
  			}
	  		break;
	  	case 'CallWaiter':
    		tableStatusController.turnOnLight(jsonObj.tableID,'callWaiter');
			ntfController.callWaiter(jsonObj.tableID);
			// Send waiter call to admin immediately
  			for(var i=0; i< adminIDList.length; i++){
  				console.log('====== newCustomer , resend occupiedTable!!! ======');
  				adminBus.send(adminIDList[i], JSON.stringify({
      				'HEAD': 'newWaiterCall',
      				'tableID': jsonObj.tableID})
      			);
  			}
	  		break	
	  	default:
	  		console.warn('[customer]:unknown request HEAD!!');
	  		break;
		}     	
    }



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
    			var $firstRow = $("#orderedQ").find('tr:nth-child(1)');
    			var thisRow_tabelID = parseInt($firstRow.attr('_tableID'));
    			var thisRow_count = parseInt($firstRow.attr('_count'));
    			console.log('thisRow_tabelID: ' + thisRow_tabelID + ' thisRow_count: ' + thisRow_count);
    			
    			//update orderedList_pendingCount
    			orderedList_pendingCount[thisRow_tabelID] -= thisRow_count;

    			//turn off table newOrder & waitLongTime light when count = 0
    			if(orderedList_pendingCount[thisRow_tabelID] === 0){
    				console.log('tableID: ' + thisRow_tabelID + ' turnOffLight!!')
    				tableStatusController.turnOffLight(thisRow_tabelID,'newOrder');
    				tableStatusController.turnOffLight(thisRow_tabelID,'waitLongTime');
    				tableStatusController.resetTimeCounter(thisRow_tabelID);
    				delete orderedList_pendingCount[thisRow_tabelID];
    			}
    			//Remove row from view
    			$firstRow.remove();
    			break;
   		  	case 'scrollPage':
				pageController.scroll(jsonObj.direction);
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
				tableStatusController.generateTable(totalAvaTable);

	  			break;
	  		case 'requestOccupiedTable':
	  			adminBus.send(event.senderId, JSON.stringify({
	      				'HEAD': 'occupiedTable',
	      				'content': occupiedTable})
	      		);
	  			break;
	  		case 'clearWaiterCall':
    			tableStatusController.turnOffLight(jsonObj.tableID,'callWaiter');
    			break;
	  		case 'clearTable':
	  			var tableID = parseInt(jsonObj.tableID);
	  			//Remove tableID from occupiedTable
	  			var index = occupiedTable.indexOf(tableID);
	  			if (index > -1){
	  				// Remove tableID from occupiedTable
	  				occupiedTable.splice(index,1);
	  				console.log('Remove tableID: ' + tableID + ' from occupiedTable');
	  				console.log('occupiedTable: ' + occupiedTable);
	  				console.log('orderedList: '+ orderedList[tableID]);

	  				// Add table mask
    				tableStatusController.clearTable(tableID);
					// Show Bill
    				ntfController.showBill(tableID);
    				// Clear timer
    				tableStatusController.resetTimeCounter(tableID);
    				// Clear table status light
    				tableStatusController.turnOffLight(tableID,'callWaiter');
		    		tableStatusController.turnOffLight(tableID,'newOrder');
    				tableStatusController.turnOffLight(tableID,'waitLongTime');

    				// Remove Orderlist
    				delete orderedList[tableID];
	  			}
	  			else{
	  				adminBus.send(event.senderId, JSON.stringify({
	      				'HEAD': 'ErrorMsg',
	      				'content': 'notOccupiedTable'})
	      			);
	  			}
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

var pageController = {
	scroll: function(direction){
   		var currentY = $(window).scrollTop();
   		if (direction === 'up')
    		$("html, body").animate({ scrollTop: currentY - 400 }, 500);
    	else if(direction === 'down')
			$("html, body").animate({ scrollTop: currentY + 400 }, 500);
	},
	currentZoom: 1, // default as 1
	zoom: function(in_or_out){
		if (in_or_out === 'in'){
			if(pageController.currentZoom <= 1.2)
				pageController.currentZoom += 0.1;
			document.body.style.zoom = pageController.currentZoom;
		}
		else if (in_or_out === 'out'){
			if(pageController.currentZoom > 0.8)
				pageController.currentZoom -= 0.1;
			document.body.style.zoom = pageController.currentZoom;
		}
	}
}

var ntfController = {
	iconType: {callWaiter: 'fa-bell', newCustomer: 'fa-child', newOrder: 'fa-list-alt', money: 'fa-money'},
	delayTime: 10000,
	newCustomer: function(){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: ntfController.iconType.newCustomer,
			textContent: '人客來囉！'
		})
		$(tmp).appendTo('#notification-container').delay(ntfController.delayTime)
						.fadeOut(function(){$(this).remove()});		
	},
	newOrder: function(tableID, dishidList){
		console.log('======= ntfController ========');
		console.log(dishidList);
		console.log('==============================');
		var orderedStr = '';
		for (var i = 0 ; i < dishidList.length ; i++){
			var dishid = dishidList[i]
			orderedStr += dishID_dishNameMap[parseInt(dishid)] + '、';
		}
		orderedStr = orderedStr.substring(0, orderedStr.length-1);
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: ntfController.iconType.newOrder,
			textContent: '<highlight>'+ tableID +'號桌</highlight>點了<highlight>'+ orderedStr +'</highlight>！'
		});
		$(tmp).appendTo('#notification-container').delay(ntfController.delayTime)
						.fadeOut(function(){$(this).remove()});
	},
	callWaiter: function(tableID){
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: ntfController.iconType.callWaiter,
			textContent: '<highlight>' + tableID +'號桌</highlight>呼叫服務生！'
		});
		$(tmp).appendTo('#notification-container').delay(ntfController.delayTime)
						.fadeOut(function(){$(this).remove()});
	},
	showBill: function(tableID){
		var totalDollar = 0;
		var thisOrderList = orderedList[tableID];
		console.log(orderedList[tableID]);
		console.log(thisOrderList);
		for (var i = 0 ; i < thisOrderList.length; i++){
			var dishID = parseInt(thisOrderList[i]);
			totalDollar += dishID_priceMap[dishID];
		}
		var tmp = _.template($('#ntf-window-tmp').html(),{
			iconType: ntfController.iconType.callWaiter,
			textContent: '<highlight>' + tableID +'號桌</highlight>結賬總金額共<highlight>'+ totalDollar +'</highlight>元！'
		});
		$(tmp).appendTo('#notification-container').delay(ntfController.delayTime)
						.fadeOut(function(){$(this).remove()});
	}
}

var tableStatusController = {
	ok_waitingTime: 5,
	ntfLightType: {'callWaiter': 'fa-bell', 'waitLongTime': 'fa-clock-o', 'newOrder': 'fa-list-alt'},
	generateTable: function(tableAmount){
		$('#table-view-container').empty();
		for (var i = 1 ; i <= totalAvaTable ; i++){
			var tmp = _.template($('#tableStatus-template').html(),{tableID: i});
			$('#table-view-container').append(tmp);

		}
		//Add clear el for float DOM
		$('#table-view-container').append('<div style="clear: both"></div>'); 
	},
	occupyTable: function(tableID){
		$('#table-view-container').find('#'+ tableID).find('.un-occupy-mask').addClass('display-none');
	},
	clearTable: function(tableID){
		$('#table-view-container').find('#'+ tableID).find('.un-occupy-mask').removeClass('display-none');
	},
	// lightType: ['callWaiter', 'waitLongTime', 'newOrder']
	turnOnLight: function(tableID,lightType){
		$('#table-view-container').find('#'+ tableID).find('.ntf-status')
		.find('.'+tableStatusController.ntfLightType[lightType]).addClass('heightlight');
	},
	turnOffLight: function(tableID,lightType){
		$('#table-view-container').find('#'+ tableID).find('.ntf-status')
		.find('.'+tableStatusController.ntfLightType[lightType]).removeClass('heightlight');
	},
	startTimeCounter: function(tableID){
		$('#table-view-container').find('#'+ tableID).find('.flipclock-container')
			.countdown({since: 0,
						format: 'MS',
						compact: true, 
						timeSeparator: ':',
						onTick: tableStatusController.invokeWaitingLight});		
	},
	resetTimeCounter: function(tableID){
		$('#table-view-container').find('#'+ tableID).find('.flipclock-container')
			.countdown('destroy')
			.empty()
			.append('<mytime>00:00</mytime>');
	},
	getCounterTime: function(tableID){
		var t = $('#table-view-container').find('#'+ tableID).find('.flipclock-container')
				.countdown('getTimes');
		console.log(t);
		
	},
	invokeWaitingLight: function(period){
		//console.log(period);
		if(period[6] == tableStatusController.ok_waitingTime){
			var tid = $(this).parent().prop('id');
			tableStatusController.turnOnLight(tid,'waitLongTime');
			console.log('Table ' + tid + ' Wait too long!');
			return
		}
		else{
			//console.log('Expired!!!!!')
			return
		}
	}
}

function testFeatures(){
	// Testing notification window!
	var iconType = {callWaiter: 'fa-bell', newCustomer: 'fa-child', newOrder: 'fa-list-alt'};

	$('#show-alert-btn').on('click',function(){
		ntfController.callWaiter(5);
	});
	$('#show-alert-btn2').on('click',function(){
		ntfController.newOrder(5,[1,2]);
	});
	$('#show-alert-btn3').on('click',function(){
		ntfController.newCustomer();
	});

    $('#change-tablStatus-btn').on('click',function(){
    	changeView.tableStatusView();
    });
    $('#change-orderedList-btn').on('click',function(){
    	changeView.orderedListView();
    });

	$('#generate-table-btn').on('click',function(){
		tableStatusController.generateTable(10);
	});



    $('#occupy-table-btn').on('click',function(){
    	var tid = $('#occupy-table-tableID').val();
    	if (tid === '')
    		tableStatusController.occupyTable(1);
    	else
    		tableStatusController.occupyTable(tid);
    });
    $('#clear-table-btn').on('click',function(){
    	var tid = $('#clear-table-tableID').val();
    	if (tid === '')
    		tableStatusController.clearTable(1);
    	else
    		tableStatusController.clearTable(tid);
    });

    $('#start-counter-btn').on('click',function(){
    	var tid = $('#counter-start-tableID').val();
    	if (tid === '')
    		tableStatusController.startTimeCounter(1);
    	else
    		tableStatusController.startTimeCounter(tid);

    });
    $('#reset-counter-btn').on('click',function(){
    	var tid = $('#counter-end-tableID').val();
    	if (tid === '')
    		tableStatusController.resetTimeCounter(1);
    	else
    		tableStatusController.resetTimeCounter(tid);

    });

    $('#get-counterTime-btn').on('click',function(){
    	var tid = $('#get-counterTime-tableID').val();
    	if(tid === '')
    		tableStatusController.getCounterTime(1);
    	else
    		tableStatusController.getCounterTime(tid);
    });


    $('#callWaiter-ntfLight-btn').on('change',function(){
    	if($(this).prop('checked') === true)
    		tableStatusController.turnOnLight(1,'callWaiter');
    	else
    		tableStatusController.turnOffLight(1,'callWaiter');
    }); 
    $('#waitLong-ntfLight-btn').on('change',function(){
		if($(this).prop('checked') === true)
    		tableStatusController.turnOnLight(1,'waitLongTime');
    	else
    		tableStatusController.turnOffLight(1,'waitLongTime');
    });
    $('#newOrder-ntfLight-btn').on('change',function(){
		if($(this).prop('checked') === true)
    		tableStatusController.turnOnLight(1,'newOrder');
    	else
    		tableStatusController.turnOffLight(1,'newOrder');
    });
    $('#zoom-in-btn').on('click',function(){
    	pageController.zoom('in');
    });
    $('#zoom-out-btn').on('click',function(){
    	pageController.zoom('out');
    })
}
