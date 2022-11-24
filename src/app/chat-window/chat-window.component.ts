import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConnectionStatus } from 'botframework-directlinejs';
import { Subscription } from 'rxjs';
import { ChatMessageModel, MsgAuthor, MsgType } from 'src/Models/ChatMessageModel';
import { DirectLineService } from 'src/Services/DirectlineService';
import * as AdaptiveCards from "adaptivecards";
import { ChoicePromptTransformer } from 'src/Models/ChoicePromptTransformer';


@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {

  public BotMsg : string

  public conversation: Array<ChatMessageModel> = [];
  private CustomIdList: Array<number> = [];

  private currConnState: ConnectionStatus;
  private subscription: Subscription = new Subscription();

  private _scrollTimer: any;

  
  public ShouldShowTypingEvent : boolean

  private directLineObj: any;
  private directLineToken:string

  public shouldShowConnectionMsg: boolean = false;
  public connectionMsgBody: string;
  public connectionMsgType: number;

  public msgAuthor = MsgAuthor

  

  constructor(private route: ActivatedRoute,
    private router: Router,
    private DirectlineObj: DirectLineService,
    private httpClient: HttpClient,
    ) { }

  ngOnInit() {
    
    let sub = this.route.queryParams.subscribe((params) => {
      this.directLineToken = params.token
    });

    this.directLineObj = this.DirectlineObj.createDirectlineConnection(
      this.directLineToken
    );

    this.checkDirectlineConnection();
    this.subscribeMessages();
    this.postLoginSuccess();

    this.scrollToBottom()

    this.focusOnTextarea()
  }

  private focusOnTextarea(){
    document.getElementById("textarea").focus()
  }

  private scrollToBottom() {
    clearTimeout(this._scrollTimer);
    this._scrollTimer = setTimeout(function () {
      let div2 = document.getElementsByClassName("main")[0];
      if (div2) {
        div2.scrollTop = div2.scrollHeight;
        console.log("height::",div2.scrollHeight)
      }
    }, 200);
  }

  private addMsgToConversation(newMsg: ChatMessageModel) {
    console.log("new message recieved.... ",newMsg)
    if(newMsg.author == MsgAuthor.User){
      console.log("came here")
      for(let i=0;i<this.conversation.length ;i++){
        console.log("status of options...",this.conversation[i].getOptionStatus(),this.conversation[i])
        if(!this.conversation[i].getOptionStatus()){
           this.conversation[i].disableOptions()
        }
      }
    }

    let customId = this.conversation.push(newMsg)-1;
    this.CustomIdList.push(customId)

    this.focusOnTextarea()

    return customId
  }

  private checkDirectlineConnection() {
    this.subscription.add(
      this.directLineObj.connectionStatus$.subscribe((connectionStatus) => {
        this.currConnState = connectionStatus;
        console.log("** Connection Status: ", connectionStatus);

        switch (connectionStatus) {
          case ConnectionStatus.Uninitialized:
            // self._modalMsgBody = null;
            this.showConnectionMsg(1, "Trying to connect...");
            break;

          case ConnectionStatus.Connecting:
            // self._modalMsgBody = null;
            this.showConnectionMsg(1, "Connecting...");
            break;

          case ConnectionStatus.Online:
            // self._modalMsgBody = null;
            // this.showHideModalMsg(1, "Connected!!");
            this.showConnectionMsg(1, "Connected!!");
            this.hideConnectionMsg();
            break;

          case ConnectionStatus.ExpiredToken:
            this.showConnectionMsg(2, "Chat Session Expired! Please login again.");
            this.router.navigate(["/login"]);
            break;

          case ConnectionStatus.FailedToConnect:
            this.showConnectionMsg(2, "Please logout and login again.");
            this.router.navigate(["/login"]);
            break;

          case ConnectionStatus.Ended:
            this.showConnectionMsg(2, "Session expired! Please login again.");
            break;

          default:
            break;
        }

        console.log("** Connection MSG:\n");
      })
    );
  }

  showConnectionMsg(msgType: number, msgBody: string) {
    this.connectionMsgBody = msgBody;
    this.shouldShowConnectionMsg = true;
    this.connectionMsgType = msgType;
  }

  hideConnectionMsg() {
    this.connectionMsgBody = null;
    this.shouldShowConnectionMsg = false;
    this.connectionMsgType = -1;
  }

  acknowledgeUserMessage(userMsg: any) {
    console.log("ChatBoxComponent ~ acknowledgeUserMessage ~ userMsg", userMsg);
    let conversationIdx: number = userMsg.channelData.customUserId;
      this.conversation[conversationIdx].acknowledgeMsg(false);
  }

  // renderCard(card:any){
  
  //     // Create an AdaptiveCard instance
  //     var adaptiveCard = new AdaptiveCards.AdaptiveCard();

  //     // Set its hostConfig property unless you want to use the default Host Config
  //     // Host Config defines the style and behavior of a card
  //     adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
  //       fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
  //       // More host config options
  //     });

  //     // Set the adaptive card's event handlers. onExecuteAction is invoked
  //     // whenever an action is clicked in the card
  //     adaptiveCard.onExecuteAction = function(action) { alert("Ow!"); }

  //     // Parse the card payload
  //     adaptiveCard.parse(card);

  //     // Render the card to an HTML element:
  //     var renderedCard = adaptiveCard.render();

  //     console.log("came here in adaptive card")
  //     console.log(renderedCard)
  //     // And finally insert it somewhere in your page:
  //     document.body.appendChild(renderedCard);
  
  //   }

  subscribeMessages() {
    // Subscribe to all activities
    this.subscription.add(
      this.directLineObj.activity$.subscribe((data) => {
        console.log(" ** ACTIVITY:", data);
      })
    );

    this.subscription.add(
      this.directLineObj.activity$
        .filter((activity) => {
          return activity.type === "typing";
        })
        .subscribe((message) => {
          this.ShouldShowTypingEvent = true
          console.log("Identified typing event!!");
        })
    );

    // Handle messages from the USER.
    this.subscription.add(
      this.directLineObj.activity$
        .filter((activity) => {
          return (
            activity.type === "message" && activity.from.id === "sampleUser"
          );
        })
        .subscribe((message) => {
          this.ShouldShowTypingEvent = false
          console.log("User msg: ", message);
          let msgId: number = parseInt(message.id.split("|")[1]);
          let customId: number = message.channelData.customUserId;
          // TODO: Properly handle out-of-order messages.
          if (this.CustomIdList.includes(customId)) {
            // The message is a fresh one. Acknowledge it!
            this.acknowledgeUserMessage(message);
            console.log("ChatBoxComponent ~ .subscribe ~ message", message);
          } else {
            console.log("message from user...")
            // The message is from history.
            let newMsg: ChatMessageModel = this.createChatModel(MsgAuthor.User,message.text,MsgType.Text,false)
            this.addMsgToConversation(newMsg);
          }
        })
    );

    // Handle messages from the BOT.
    this.subscription.add(
      this.directLineObj.activity$
        .filter((activity) => {
          return (
            activity.type === "message" && activity.from.id !== "sampleUser"
          );
        })
        .subscribe((message) => {
          this.ShouldShowTypingEvent = false

          console.log("Bot msg: ", message);
          let currMsgBody: any;
          let currMsgType: MsgType;
          let currMsgTime: Date = new Date(message.timestamp);

          if (message.attachments && message.channelData) {
            // Process Adaptive Cards
            let dataType = message.channelData.dataType;
            let rawAdaptiveCard = message.attachments;
            console.log(JSON.stringify(rawAdaptiveCard[0]) + "a123");
            if (rawAdaptiveCard[0].content.body) {
              // switch (numDataBlocks) {
              switch (dataType) {
                
                
                case "ShowCategory":
                  // ShowCategory
                  currMsgType = MsgType.ShowCategory;
                  currMsgBody = new ChoicePromptTransformer(message,currMsgType);
                  console.log("showcategory...")
                  
                  // this.renderCard(message);
                  break;


                default:
                  // this.renderCard(message);

              }
            } else {
              currMsgType = MsgType.Text;
              currMsgBody = rawAdaptiveCard[0].content.title;
            }
          } else if (
            (message.attachments || message.adaptiveCard) &&
            !message.channelData
          ) {
            // Adaptive cards without any channel-data
            // TODO: Remove the temporary solution below.
            let rawCard = message.adaptiveCard
              ? message.adaptiveCard
              : message.attachments[0];
            if (rawCard.content.actions) {
              // Action Card
              // currMsgType = MsgType.ActionCard;
              // currMsgBody = new ActionCardModel(rawCard);
            } else if (
              rawCard.contentType === "application/vnd.microsoft.card.video"
            ) {
              // Video Card
              // currMsgType = MsgType.VideoCard;
              currMsgBody = rawCard.content.media[0].url;
            } else if (
              rawCard.contentType === "application/vnd.microsoft.card.adaptive"
            ) {
              // currMsgType = MsgType.AdaptiveCard;
              // currMsgBody = self.renderAdaptiveCard(rawCard.content);
            } else {
              // Error Message
              currMsgType = MsgType.Text;
              currMsgBody =
                "ERROR: Unidentified attachment!! Kindly report to the dev team." +
                JSON.stringify(rawCard);
            }
          } else {
            // Text or Choice response
            if (message.channelData) {
              let dataType = message.channelData.dataType;

              switch (dataType) {
                case "OTHER_CHOICE":
                  currMsgType = MsgType.ChoicePrompt;
                  currMsgBody = new ChoicePromptTransformer(message);
                  break;

                default:
                 
                  currMsgType = MsgType.Text;
                  currMsgBody = message.text;
                  break;
              }
            } else {
              // Plain Text
              currMsgType = MsgType.Text;
              currMsgBody = message.text;
            }
          }

            let newMsg = this.createChatModel(MsgAuthor.Bot,currMsgBody,currMsgType,false,currMsgTime)
             

            this.addMsgToConversation(newMsg)
            console.log("conversation list...",this.conversation)
            // console.log("ChatBoxComponent ~ .subscribe ~ newMsg", newMsg);

            this.scrollToBottom()
        })
    );
  }

  private postLoginSuccess() {
    this.directLineObj
      .postActivity({
        from: {
          id:  "sampleUser",
          },
        name: "UserLoginSuccess",
        type: "event",
        value: "",
      })
      .subscribe((data) => {
        console.log("ChatBoxComponent ~ .subscribe ~ data", data);
        console.log("SUCCESS: Requested for Greeting dialog!");
      });
  }


  onSubmit()
    {
      console.log("data::: ",this.BotMsg)
      if (this.BotMsg && this.BotMsg != "") {
        // self.checkDirectlineConnection();
        if (this.currConnState == ConnectionStatus.Online) {
          console.log("send msg to bot now")
          this.sendMsgToBot(this.BotMsg);
        } else {
          console.log(
            "** ERROR: Connection interrupted! Cannot send messages to bot."
          );
        }
  
        // Clear the text-area
        this.BotMsg = "";
      }
  }

  private sendMsgToBot(userMsg) {    
 
    // First add the user message to the conversation list, and then POST it.
    let customMsgId: number = 0;
    let newMsg: ChatMessageModel = this.createChatModel(MsgAuthor.User,userMsg,MsgType.Text,true) 

    customMsgId = this.addMsgToConversation(newMsg)

    this.scrollToBottom()

    // POST the message.
    this.directLineObj
      .postActivity(this.createTextMsgPayload(userMsg, customMsgId))
      .subscribe(
        (message) => {
          console.log(`** sendMsgToBot Success: ${JSON.stringify(message)}`);
          return;
        },
        (error) => {
          console.log(`** sendMsgToBot ERROR: ${JSON.stringify(error)}`);
          return;
        }
      );

    }

  sendCustomAdaptiveChoiceResponse(
    card: ChoicePromptTransformer,
    selectedIdx: number,
  ) {
    console.log("cards:: ",card)
      console.log("** selectedChoice: ", card.choices[selectedIdx]);
      if (this.currConnState == ConnectionStatus.Online) {
        let customMsgId: number;
        let newMsg: ChatMessageModel = this.createChatModel(MsgAuthor.User,card.choices[selectedIdx]["title"],MsgType.Text,true)
        console.log("user message:: >",newMsg)
        customMsgId = this.addMsgToConversation(newMsg);
        this.scrollToBottom()
        
        this.directLineObj
          .postActivity(this.createCustomMsgPayload(customMsgId,card.choices[selectedIdx]["data"]))
          .subscribe(
            (obs) => {
              console.log("form success");
            },
            (error) => {
              console.log(`ERROR: ${JSON.stringify(error)}`);
            }
          );
      }
    
  }

  createTextMsgPayload(msg: string, customMsgId: number) {
    console.log("create message....",customMsgId)
    return {
      from:  {id:"sampleUser"} ,
      type: "message",
      text: msg,
      channelData: {
        customUserId: customMsgId,
        username: "sampleUser",
      },
    };
  }

  createCustomMsgPayload(customMsgId: number,value?: any,text?:any) {
    console.log("create message....",customMsgId)
    let obj = {
      from:  {id:"sampleUser"} ,
      type: "message",
      value: value,
      text: text,
      channelData: {
        customUserId: customMsgId,
        username: "sampleUser",
      },
    };

    console.log("object::: ",obj)
    return obj
  }

  
  createChatModel(author:MsgAuthor,message:any,type:MsgType,acknowledge:boolean,msgTime?:any){
    return new ChatMessageModel(
      author,
      message,
      type,
      msgTime ? msgTime : new Date(),
      acknowledge
    );
  }


}




