/**
 * Created by Tina on 6/10/17.
 */

var elasticsearch = require('elasticsearch');
var execute = false;
var records = 0;
var chunkSize = 50;
var lineReader = require('line-reader');
var datapath = './InputData/ProductRecords.json';

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});

var bulkBody = [];

// create an index

function initIndex() {
    return client.indices.create({
        index: 'product'
    });
}
exports.initIndex = initIndex;

// delete an index
function deleteIndex() {
    return client.indices.delete({
        index: 'product'
    });
}
exports.deleteIndex = deleteIndex;
/* 
check if the index exists
*/
function indexExists() {  
    return client.indices.exists({
        index: 'product'
    });
}
exports.indexExists = indexExists; 


// creat mapping for the index
function initMapping() {
    return client.indices.putMapping({
        index: 'product',
        type: 'products',
        body: {
            properties: {
    	        	asin: { type: "string", "index" : "keyword" },
    	          title: { type: "string", "analyzer": "simple"},
    	          categories: { type: "string", "index" : "keyword"},
    	          description: { type: "string", "analyzer": "simple"}
            }
        }
    });
}
exports.initMapping = initMapping;

// Stores a typed JSON document in an index
function addProduct(product) {
    return client.index({
        index: 'product',
        type: 'products',
        body: {
        	asin: product.asin,
        	title: product.name,
        	categories: product.description,
        	description: product.group
        }
    });
}
exports.addProduct = addProduct;

var bulkIndex = function bulkIndex(index, type, path) {
	lineReader.eachLine(path, function(line, last) {
		execute = false;
		currentLine = line.toString().replace(/'/g, "\"", "g");
		try{
			jsonRecord = JSON.parse(currentLine);
			if(jsonRecord.description == null){
			  jsonRecord.description = "";
			}
			bulkBody.push({index: {_index: index, _type: type}});
			bulkBody.push(jsonRecord);
			records++;
			// console.log("records read is", records);
			if(records === chunkSize)
				execute = true;
		} catch (err) {
		    execute = false;//there was a quote in the text and the parse failed ... skip insert
		    console.log(err);
  		} 
  		if (execute){
  			// console.log('----------------------');
  			// console.log('should have 100 products in the body');
  			// console.log(bulkBody.length);
  			client.bulk({body: bulkBody}, function(err, res){ 
		        if(err)
		            console.log("Failed Bulk operation", err);
		        else 
		            console.log("Successfull update: %s products", bulkBody.length); 
	   	 	}); 
	   	 	records = 0;
	   	 	bulkBody = [];
        // console.log("set records back to 0");
		}
	});
}

indexExists().then(function (exists) {  
  if (exists) {
    return deleteIndex();
  }
}).then(function () {
  return initIndex().then(initMapping).then(bulkIndex('product', 'products', datapath))
  // return initIndex().then(initMapping).then(client.bulk({body: bulkBody}))
});


// count how many documents in elasticsearch
// curl -XGET 'localhost:9200/product/products/_count?pretty'



// var obj = {
// 	asin: "00000TEST",
//   	productName: "coffee pods for testing",
//   	productDescription: "Really good coffee pods",
//   	productGroup: "food"
// }

// bulkBody.push({
// 	index: {
// 		_index: 'product',
// 		_type: 'products'
// 	}
// })
// bulkBody.push(obj);

