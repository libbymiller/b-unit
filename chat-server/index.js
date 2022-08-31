var express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;
var sys = require('sys')
var exec = require('child_process').exec;
var child;

var my_name = "b-unit";

// emojis stuff

var emoji_list =[];
var syns = {};

var parsedJSON = require('./emojis.json');

for (var prop in parsedJSON) {
    if (parsedJSON.hasOwnProperty(prop)) {

      var arr = parsedJSON[prop];

      if(arr && arr.length > 1){
        for(var i = 0; i < arr.length; i++){
         let ff = arr[i];
         if(!syns[ff]){
           syns[ff] = prop;
          }
        }
      }
    }
}
 
//console.log("syns",syns);

var output_exclude = []; //words to exclude from output, e.g. peoples' names, swearing etc
var input_exclude = ["\\<.*?\\>", my_name]; //words to exclude before sending to the GPT2 server (urls, my name)

function test_exclude(ts, exclude){
   console.log("txt",ts);

   for (var i=0; i< exclude.length; i++){
     var rr = "(\\W"+exclude[i]+"|"+exclude[i]+"\\W)"; // remove exclusions only where single words
     //console.log(rr);

     var regex = new RegExp( rr, 'gi' );
     ts = ts.replace(regex," ")

   }
   if(ts){
     ts = ts.replace(/\s\s/g, " "); // remove double spaces
     return ts.trim();
   }else{
     return "";
   }
}

function emojiItUp(txt){

  txt = txt.replace(/\:skin.*\:/gi,""); // handled elsewhere
  txt = txt.replace("::",":");
  let r = txt.match(/\:.*?\:/gi);
  console.log("regex result",r);
  let result = txt;
  if(r){
   r.forEach(word => {
    word = word.trim();
    let word1 = word.replace(/\:/gi,"");
    console.log("looking for ",word,word1,syns[word1]);
    if(syns[word1]){
        console.log("match",word1,syns[word1]);
        result = result.replace(word,syns[word1]);
    }
   });
  }
  console.log("result is",result);
  return result;
}


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    console.log("got message",msg);
    io.emit('chat message', msg);
    respond_to_message(msg);
  });

  socket.on('status message', msg => {
    console.log("got status message",msg);
    io.emit('status message', msg);
  });
});


function respond_to_message(json){

   let message_text = json.text;
   console.log("message_text",message_text);

   if(message_text!=""){
    var mt = test_exclude(message_text, input_exclude)

    console.log("new input text "+mt)

    if(mt != ""){
      var new_text = "http://0.0.0.0:8080/?text="+encodeURIComponent(mt);
      console.log(new_text);
      // get the data from the server
      var command = 'curl "'+new_text+'"';

      //console.log(command);

      console.log("sending status message")
      io.emit('status message', my_name+" is typing...");

      child = exec(command, function (error, stdout, stderr) {
             if (error !== null) {
               console.log('exec error: ' + error);
             }else{
               var candidates = stdout.split("\n")
               //sort by longest == most intersting probbaly.

               const to_send = candidates.sort((a,b) => b.length - a.length);
               var ts = "";
               console.log("stdout "+stdout);
               console.log("to_send "+ts);
               for(var i=0; i< to_send.length; i++){
                 ts = to_send[i];
                 ts = test_exclude(ts, output_exclude);
                 // if there's nothing left after exclusions, skip to the next one
                 if(ts!=""){
                     break;
                 }
               }
               ts = emojiItUp(ts);
               io.emit('chat message', {name: my_name, text: ts});
             }
      });
    }else{
       console.log("text is empty "+mt);
    }
  }else{
     console.log("example text is empty");
  }
}



http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
