$(function(){
	var content = [10,20,30,40,20,30,20,30];

	var test = _.countBy(content, function(num) {
		  return num;
		});	
	console.log(content);
	console.log(test);

})
