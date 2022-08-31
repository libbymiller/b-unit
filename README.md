# b-unit

A bot for Barbara

This uses a GPT-2 model to create a chat bot that lives in a web browser on a pi 4.

Thanks to David for the designs.

chat-server is based on https://github.com/socketio/chat-example

emojis are from https://github.com/muan/emojilib

# installation

Follow (these instructions)[https://github.com/libbymiller/real_libby#for-a-pi-4] to set up the pi and create and add a fine tuned model and a web server to access it.

Then instead of creating a slackbot, 

   git clone https://github.com/libbymiller/b-unit

install node

   curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -

install libraries

   npm install
   
and run 

   sudo node index.js

or copy the systemd files to `/lib/systemd/system/` and then:

   sudo cp systmd/*.service /lib/systemd/system/
   sudo systemctl enable b-unit.service 
   sudo systemctl start b-unit.service
   sudo systemctl enable b-unit_chat.service 
   sudo systemctl start b-unit_chat.service

