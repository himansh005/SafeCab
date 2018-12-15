// import $ from 'jquery';
// import 'bootstrap-material-design/dist/css/bootstrap-material-design.min.css';
// import 'bootstrap-material-design';

// import '../../assets/stylesheets/main.css';
// import '../../assets/stylesheets/videogrid.css';
import { Browser, Utils } from '../../utils';
import SignalingClient from '../../utils/signalingClient';

//code for dashboard sliders


// code to handle dynamics



var keys=[0,1,1,1,1,1,1,1,1,1];

var con;

	// pristine=1;
	



function risk(id,msg){
  var lastDigit=id.slice(-1);
  document.querySelector(".risk"+lastDigit).innerHTML="Risk : "+msg.risk+"%";

};

function trigger(id,msg){
	var lastDigit=id.slice(-1);
	if(msg.stream=="on" && (keys[lastDigit])==1)
	{
		console.log(id);
		console.log("100"+lastDigit);
		join(id,"100"+lastDigit);
		myMove(lastDigit,0);
		$("#"+lastDigit+"a").replaceWith('<div id='+lastDigit+'a><a href="#"  style="pointer-events:all;" onclick="lightbox_open('+lastDigit+');"><i class="fas fa-play"></i></a><div>');   
		keys[lastDigit]=0;
	}
	console.log(keys);


};


function connectivity(id,con){
  var lastDigit=id.slice(-1);
  if(con=="Online"){
  document.querySelector("#status"+lastDigit).innerHTML='<div id="Connected'+lastDigit+'" style="background-color:green;margin-top: 1.5%;margin-right:2%;float: left;"></div>Online<div id="cid" style="float: right;">Safecab '+lastDigit+'</div></div>';
          
  }
  else
  {
    document.querySelector("#status"+lastDigit).innerHTML='<div id="Connected'+lastDigit+'" style="background-color:gray;margin-top: 1.5%;margin-right:2%;float: left;"></div>Offline<div id="cid" style="float: right;">Safecab '+lastDigit+'</div></div>';
  }
 };

function hidden(id,msg){
  var lastDigit=id.slice(-1);
  document.querySelector("#hidden"+lastDigit).innerHTML='Driver :' + msg.driver+'<br>Weapons: '+msg.weapons+'<br>Environment: '+msg.cabenv+'<br>Vocals: tense';
}


// {"weapons": 0, "risk": 0, "cabenv": "calm", "stream": 0, "driver": 0}

function mapper(tag,msg){

        var lastDigit=tag.slice(-1);

		msg=JSON.parse(msg);
        risk(tag,msg);
        trigger(tag,msg);
        hidden(tag,msg);

        $('#conn'+lastDigit).replaceWith('<div id="conn'+lastDigit+'">SafeCab'+lastDigit+' <br>Risk : '+msg.risk+' <br><div id="Connected'+lastDigit+'" style="background-color:green;margin-top: 1.5%;margin-right:2%;float: left;"></div>Online<div style="float: right;margin-top:-6%;color: white;">Weapons:'+msg.weapons+' <br> Driver: '+msg.driver+'</div>');
     
        
}



class Client {
  // Construct a meeting client with signal client and rtc client
  constructor(sclient, localAccount) {
    this.cleanData();
    this.signal = sclient;
    this.localAccount = localAccount;
    this.current_conversation = null;
    this.current_msgs = null;
    this.loadFromLocalStorage();
    this.updateChatList();

    this.subscribeEvents();
  }

  invoke(func, args, cb) {
    let session = this.signal.session;
    session &&
      session.invoke(func, args, function(err, val) {
        if (err) {
          console.error(val.reason);
        } else {
          cb && cb(err, val);
        }
      });
  }

  cleanData() {
    localStorage.setItem('chats', '');
    localStorage.setItem('messages', '');
  }

  updateLocalStorage() {
    localStorage.setItem('chats', JSON.stringify(this.chats));
    localStorage.setItem('messages', JSON.stringify(this.messages));
  }

  loadFromLocalStorage() {
    this.chats = JSON.parse(localStorage.getItem('chats') || '[]');
    this.messages = JSON.parse(localStorage.getItem('messages') || '{}');
  }

  updateChatList() {
    let client = this;
    let chatsContainer = $('.chat-history');
    chatsContainer.html('');
    let html = '';
    for (var i = 0; i < this.chats.length; i++) {
      html +=
        '<li name="' +
        this.chats[i].id +
        '" type="' +
        this.chats[i].type +
        '" account="' +
        this.chats[i].account +
        '">';
      html += '<div class="title">' + this.chats[i].account + '</div>';
      html += '<div class="desc">' + this.chats[i].type + '</div>';
      html += '</li>';
    }
    chatsContainer.html(html);

    $('.chat-history li')
      .off('click')
      .on('click', function() {
        let mid = $(this).attr('name');
        let type = $(this).attr('type');
        let account = $(this).attr('account');
        if (type === 'channel') {
          client.signal.leave().then(() => {
            client.signal.join(account).then(() => {
              client.showMessage(mid);
            });
          });
        } else {
          client.showMessage(mid);
        }
      });

    if (this.chats.length > 0) {
      let type = this.chats[0].type;
      let account = this.chats[0].account;
      let mid = this.chats[0].id;
      if (type === 'channel') {
        client.signal.leave().then(() => {
          client.signal.join(account).then(() => {
            client.showMessage(mid);
          });
        });
      } else {
        client.showMessage(mid);
      }
    }
  }

  showMessage(mid) {
    let client = this;
    this.current_msgs = this.messages[mid] || [];
    let conversation = this.chats.filter(function(item) {
      return String(item.id) === String(mid);
    });
    if (conversation.length === 0) {
      return;
    }
    this.current_conversation = conversation[0];
    this.current_msgs = this.messages[this.current_conversation.id] || [];
    $('#message-to-send')
      .off('keydown')
      .on('keydown', function(e) {
        if (e.keyCode == 13) {
          e.preventDefault();
          client.sendMessage($(this).val());
          $(this).val('');
        }
      });

    let chatMsgContainer = $('.chat-messages');
    chatMsgContainer.html('');
    let html = '';
    for (let i = 0; i < this.current_msgs.length; i++) {
      html += this.buildMsg(
        this.current_msgs[i].text,
        this.current_msgs[i].account === this.localAccount,
        this.current_msgs[i].ts
      );
    }
    $('.chat-history li').removeClass('selected');
    $('.chat-history li[name=' + mid + ']').addClass('selected');
    chatMsgContainer.html(html);
    chatMsgContainer.scrollTop(chatMsgContainer[0].scrollHeight);

    if (conversation[0].type === 'instant') {
      let [query, account] = [
        'io.agora.signal.user_query_user_status',
        conversation[0].account
      ];
      let peerStatus;
      client.invoke(query, { account }, function(err, val) {
        //
        
        if (val.status) {
          peerStatus = 'Online';
          
          connectivity(conversation[0].account,peerStatus);

          // $("."+account).find("#Connected").replaceWith('<div id="Connected">online</div>')

          //inser status code here
        } else {
          peerStatus = 'Offline';
          connectivity(conversation[0].account,peerStatus);

           // setInterval(function(){connectivity(conversation[0].account,peerStatus);},100);

          // connectivity(conversation[0].account,peerStatus);
          // connectivity(account,peerStatus);

          // $("."+account).find("#Connected").replaceWith('<div id="Connected">offline</div>')

        }

        $('.detail .nav').html(conversation[0].account + `(${peerStatus})`);
      });

    } else {
      client.invoke(
        'io.agora.signal.channel_query_num',
        { name: conversation[0].account },
        (err, val) => {
          $('.detail .nav').html(`${conversation[0].account}(${val.num})`);
        }
      );
    }
  }

  sendMessage(text) {
    if (!text.trim()) return false; // Empty
    if (!this.current_msgs) {
      return;
    }
    let msg_item = { ts: new Date(), text: text, account: this.localAccount };
    this.current_msgs.push(msg_item);
    if (this.current_conversation.type === 'instant') {
      this.signal.sendMessage(this.current_conversation.account, text);
    } else {
      this.signal.broadcastMessage(text);
    }
    let chatMsgContainer = $('.chat-messages');
    chatMsgContainer.append(this.buildMsg(text, true, msg_item.ts));
    chatMsgContainer.scrollTop(chatMsgContainer[0].scrollHeight);
    this.updateMessageMap();
    // This.showMessage(this.current_conversation.id)
  }

  updateMessageMap(c, m) {
    let conversation = c || this.current_conversation;
    let msgs = m || this.current_msgs;
    this.messages[conversation.id] = msgs;
    this.chats.filter(item => {
      if (item.id === conversation.id && item.type === conversation.type) {
        item.lastMoment = new Date();
      }
    });
    this.updateLocalStorage();
  }

  // Return a promise resolves a remote account name
  addConversation() {
    let deferred = $.Deferred();
    let dialog = $('.conversation-modal');
    let accountField = dialog.find('.remoteAccountField');
    let localAccount = this.localAccount;
    let client = this;

    dialog
      .find('.confirmBtn')
      .off('click')
      .on('click', e => {
        // Dialog confirm
        let account = $('.conversation-target-field').val();
        let type = $(':radio[name="type"]')
          .filter(':checked')
          .val();

        // Validation
        let isValid = () => {
          if (!account) return false; // Empty
          if (!/^[^\s]*$/.test(account)) {
            // Has space character
            return false;
          }
          return true;
        };

        let isExisted = () => {
          return client.chats.some(function(item) {
            return item.account === account && item.type === type;
          });
        };
        let isSelf = () => {
          return type === 'instant' && account === localAccount;
        };

        if (!isValid()) {
          $('.conversation-target-field')
            .siblings('.invalid-feedback')
            .html('Please input a valid name.');
          $('.conversation-target-field')
            .removeClass('is-invalid')
            .addClass('is-invalid');
        } else if (isSelf()) {
          $('.conversation-target-field')
            .siblings('.invalid-feedback')
            .html('You cannot chat with yourself.');
          $('.conversation-target-field')
            .removeClass('is-invalid')
            .addClass('is-invalid');
        } else if (isExisted()) {
          $('.conversation-target-field')
            .siblings('.invalid-feedback')
            .html('Existed.');
          $('.conversation-target-field')
            .removeClass('is-invalid')
            .addClass('is-invalid');
        } else {
          $('.conversation-target-field').removeClass('is-invalid');
          dialog.find('.conversation-target-field').val('');
          dialog.modal('hide');
          client.chats.splice(0, 0, {
            id: new Date().getTime(),
            account: account,
            type: type
          });
          client.updateLocalStorage();
          client.updateChatList();
          deferred.resolve(account);
        }
      });

    
    
    dialog
      .find('.cancelBtn')
      .off('click')
      .on('click', e => {
        // Dialog confirm
        dialog.modal('hide');
        deferred.reject();
      });

    dialog
      .find('.conversation-target-field')
      .off('keydown')
      .on('keydown', function(e) {
        if (e.keyCode == 13) {
          e.preventDefault();
          dialog.find('.confirmBtn').click();
        }
      });

    // Start modal
    dialog.modal({ backdrop: 'static', focus: true });

    return deferred;
  }

  // Events
  subscribeEvents() {
    let signal = this.signal;
    let client = this;

    $('.new-conversation-btn')
      .off('click')
      .on('click', function() {
        client.addConversation();
      });

    $('.logout-btn')
      .off('click')
      .on('click', function() {
        signal.logout().then(() => {
          window.location.href = 'index.html';
        });
      });

    $(':radio[name="type"]').change(function() {
      var type = $(this)
        .filter(':checked')
        .val();
      var field = $('.conversation-target-field');
      switch (type) {
        case 'instant':
          field.attr('placeholder', "Input someone's account");
          break;
        case 'channel':
          field.attr('placeholder', 'Input a channel name');
          break;
      }
    });

    signal.sessionEmitter.on('onMessageInstantReceive', (account, uid, msg) => {
      this.onReceiveMessage(account, msg, 'instant');
    });
    signal.channelEmitter.on('onMessageChannelReceive', (account, uid, msg) => {
      if (account !== signal.account) {
        this.onReceiveMessage(signal.channel.name, msg, 'channel');
      }
    });

    signal.channelEmitter.on('onChannelUserLeaved', (account, uid) => {
      client.invoke(
        'io.agora.signal.channel_query_num',
        { name: signal.channel.name },
        (err, val) => {
          $('.detail .nav').html(`${signal.channel.name}(${val.num})`);
        }
      );
    });

    signal.channelEmitter.on('onChannelUserJoined', (account, uid) => {
      client.invoke(
        'io.agora.signal.channel_query_num',
        { name: signal.channel.name },
        (err, val) => {
          $('.detail .nav').html(`${signal.channel.name}(${val.num})`);
        }
      );
    });
  }

  onReceiveMessage(account, msg, type) {
    let client = this;
    console.log(msg);
    console.log(account);
    mapper(account,msg);

    // JSON.parse(localStorage.getItem() || '[]')
    var conversations = this.chats.filter(function(item) {
      return item.account === account;
    });

    if (conversations.length === 0) {
      // No conversation yet, create one
      conversations = [{ id: new Date().getTime(), account: account, type: type }];
      client.chats.splice(0, 0, conversations[0]);
      client.updateLocalStorage();
      client.updateChatList();
    }

    for (let i = 0; i < conversations.length; i++) {
      let conversation = conversations[i];

      let msgs = this.messages[conversation.id] || [];
      let msg_item = { ts: new Date(), text: msg, account: account };
      msgs.push(msg_item);
      this.updateMessageMap(conversation, msgs);
      let chatMsgContainer = $('.chat-messages');
      if (String(conversation.id) === String(this.current_conversation.id)) {
        this.showMessage(this.current_conversation.id)
        chatMsgContainer.scrollTop(chatMsgContainer[0].scrollHeight);
      }
    }
  }

  buildMsg(msg, me, ts) {
    let html = '';
    let timeStr = this.compareByLastMoment(ts);
    if (timeStr) {
      html += `<div>${timeStr}</div>`;
    }
    let className = me ? 'message right clearfix' : 'message clearfix';
    html += '<li class="' + className + '">';
    html += '<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/1_copy.jpg">';
    html +=
      '<div class="bubble">' +
      Utils.safe_tags_replace(msg) +
      '<div class="corner"></div>';
    html += '<span>' + this.parseTwitterDate(ts) + '</span></div></li>';

    return html;
  }

  compareByLastMoment(ts) {
    let lastMoment = null;
    this.chats.forEach(item => {
      if (
        item.id === this.current_conversation.id &&
        item.type === this.current_conversation.type
      ) {
        lastMoment = item.lastMoment;
      }
    });
    if (!lastMoment) {
      let time = new Date();
      return time.toDateString() + ' ' + time.toLocaleTimeString();
    }
    let diff = Math.floor((ts - lastMoment) / 1000);
    if (diff < 120) {
      return '';
    }
    return new Date().toLocaleTimeString();
  }

  parseTwitterDate(tdate) {
    var system_date = new Date(Date.parse(tdate));
    var user_date = new Date();
    // If (K.ie) {
    //     system_date = Date.parse(tdate.replace(/( \+)/, ' UTC$1'))
    // }
    var diff = Math.floor((user_date - system_date) / 1000);
    if (diff <= 1) {
      return 'just now';
    }
    if (diff < 20) {
      return diff + ' seconds ago';
    }
    if (diff < 40) {
      return 'half a minute ago';
    }
    if (diff < 60) {
      return 'less than a minute ago';
    }
    if (diff <= 90) {
      return 'one minute ago';
    }
    if (diff <= 3540) {
      return Math.round(diff / 60) + ' minutes ago';
    }
    if (diff <= 5400) {
      return '1 hour ago';
    }
    if (diff <= 86400) {
      return Math.round(diff / 3600) + ' hours ago';
    }
    if (diff <= 129600) {
      return '1 day ago';
    }
    if (diff < 604800) {
      return Math.round(diff / 86400) + ' days ago';
    }
    if (diff <= 777600) {
      return '1 week ago';
    }
    return 'on ' + system_date;
  }
}

const appid = AGORA_APP_ID || '',
  appcert = AGORA_CERTIFICATE_ID || '';
if (!appid) {
  alert('App ID missing!');
}
let localAccount = Browser.getParameterByName('account');
let signal = new SignalingClient(appid, appcert);
// Let channelName = Math.random() * 10000 + "";
// by default call btn is disabled

signal.login(localAccount).then(() => {
  // Once logged in, enable the call btn
  
  let client = new Client(signal, localAccount);
  $('#localAccount').html(localAccount);

  
  for(var i=1;i<10;i++){
  client.chats.splice(0, 0, {
            id: new Date().getTime(),
            account: 'safecab'+i,
            type: 'instant'
  });
  client.updateLocalStorage();
  client.updateChatList();}

  //terminate stream function

  $('#term').on('click',function(){client.signal.sendMessage("safecab1","stop");});

  
// $('#term').siblings('#mainvid').attr("class")
  
});





$(document).ready(function(){
  $('#status1').click(function(){
        $('#hidden1').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status2').click(function(){
        $('#hidden2').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status3').click(function(){
        $('#hidden3').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status4').click(function(){
        $('#hidden4').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status5').click(function(){
        $('#hidden5').slideToggle('swing');
  });
  });


$(document).ready(function(){
  $('#status6').click(function(){
        $('#hidden6').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status7').click(function(){
        $('#hidden7').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status8').click(function(){
        $('#hidden8').slideToggle('swing');
  });
  });

$(document).ready(function(){
  $('#status9').click(function(){
        $('#hidden9').slideToggle('swing');
  });
  });


$(document).ready(function(){
  $('#boxclose1').click(function(){
    $("#animate1").replaceWith('<hr id="animate1" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
    $("#1a").replaceWith('<div id="1a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("1");"><i class="fas fa-play"></i></a></div>');   
	myMove(1,1);
	keys[1]=1;
  });
  });



$(document).ready(function(){
	$("#boxclose2").click(function(){
	myMove(2,1);
	$("#animate2").replaceWith('<hr id="animate2" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#2a").replaceWith('<div id="2a"><a href="#" style="pointer-events:none;" onclick="lightbox_open("2");"><i class="fas fa-play"></i></a></div>');
	keys[2]=1;
}); 
});


$(document).ready(function(){
  $('#boxclose3').click(function(){

  	$("#animate3").replaceWith('<hr id="animate3" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#3a").replaceWith('<div id="3a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("3");"><i class="fas fa-play"></i></a></div>');   
	myMove(3,1);keys[3]=1;}); 
	

});
$(document).ready(function(){
  $('#boxclose4').click(function(){

  	$("#animate4").replaceWith('<hr id="animate4" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#4a").replaceWith('<div id="4a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("4");"><i class="fas fa-play"></i></a></div>');   
	myMove(4,1);
	keys[4]=1;

});});
$(document).ready(function(){
  $('#boxclose5').click(function(){
  	$("#animate5").replaceWith('<hr id="animate5" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#5a").replaceWith('<div id="5a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("5");"><i class="fas fa-play"></i></a></div>');   
	myMove(5,1);
	keys[5]=1;

});});
$(document).ready(function(){
  $('#boxclose6').click(function(){
  	$("#animate6").replaceWith('<hr id="animate6" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#6a").replaceWith('<div id="6a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("6");"><i class="fas fa-play"></i></a></div>');   
	myMove(6,1);
	keys[6]=1;

});});
$(document).ready(function(){
  $('#boxclose7').click(function(){
  	$("#animate6").replaceWith('<hr id="animate6" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#7a").replaceWith('<div id="7a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("7");"><i class="fas fa-play"></i></a></div>');   
	myMove(7,1);
	keys[7]=1;

});});
$(document).ready(function(){
  $('#boxclose8').click(function(){
  	$("#animate8").replaceWith('<hr id="animate8" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#8a").replaceWith('<div id="8a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("8");"><i class="fas fa-play"></i></a></div>');   
	myMove(8,1); 
	keys[8]=1;
});})


$(document).ready(function(){
  $('#boxclose9').click(function(){
  	$("#animate9").replaceWith('<hr id="animate9" style="width:100%;height:1px; background-color: orange; position: relative; -webkit-transition: all 0.4s ease;transition: all 0.4s ease;margin-top:45px;margin-bottom: 0px;border: none;">');
	$("#9a").replaceWith('<div id="9a"><a href="#"  style="pointer-events:none;" onclick="lightbox_open("9");"><i class="fas fa-play"></i></a></div>');   
	myMove(9,1);
	keys[9]=1;
});});





    

// function sleep(milliseconds) {
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds){
//       break;
//     }
//   }
// }
