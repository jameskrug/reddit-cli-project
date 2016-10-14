var request = require('request');
var inquirer = require("inquirer");
var colors = require("colors");
const imageToAscii = require("image-to-ascii");
var wrap = require("word-wrap");
var thisPageUrl = "";
var ableToGoBack = 0;
var overAllPage = "";
var overAllPost = {};


function requestAsJson (url, callback){
  console.log(url);
  request(url, function(err, data){
    if (err){
      callback(err);
    }
    else{
      try{
        var response = JSON.parse(data.body);
        callback(null, response);
      }
      catch(error){
        callback(error);
      }
    }
  });
}

function getHomepage(callback) {
  thisPageUrl = 'https://reddit.com/.json';
  overAllPage = thisPageUrl;
  requestAsJson(thisPageUrl, function(err, data) {
    if (err) {
      callback(err);
    }
    else {
      try {
        callback(null, data.data.children);
      }
      catch(e) {
        callback(e);
      }
    }
  });
}

function sortByWhat(callback){
  var sortMethods = [
    {name: 'HOT', value: 'hot'},
    {name: 'NEW', value: 'new'},
    {name: 'RISING', value: 'rising'},
    {name: "CONTROVERSIAL", value: "controversial"},
    {name: "TOP", value: "top"}
  ];
  
  inquirer.prompt({
    type : "list",
    name : "sortBy",
    message: "How Would You Like to Sort?",
    choices : sortMethods
  }).then(function(answer){
    callback(answer.sortBy);
  });
}

function getSortedHomepage(sortingMethod, callback) {
  sortByWhat(function(x){
    thisPageUrl = 'https://reddit.com/'+x+'/.json';
    overAllPage = thisPageUrl;
    requestAsJson(thisPageUrl, function(err, data) {
      if (err) {
        console.log("error:",err);
      }
      else {
        try {
          displayPage(data.data.children);
        }
        catch(e) {
          console.log("issues:",e);
        }
      }
    });
  });
}

function getSubreddit(subreddit, callback) {
  thisPageUrl = "https://reddit.com/r/"+subreddit+"/.json";
  overAllPage = thisPageUrl;
  requestAsJson(thisPageUrl, function(err, data){
    console.log(thisPageUrl);
    if (err){
      callback(err);
    }
    else{
      try {
        callback(null, data.data.children);
      }
      catch(e) {
       callback(e);
      }
    }
  });
}

function getSortedSubreddit(subreddit, sortingMethod, callback) {
  sortByWhat(function(x){
    whichSubreddit(function(subreddit){
      thisPageUrl = 'https://reddit.com/r/'+subreddit+"/"+x+'/.json';
      overAllPage = thisPageUrl;
      requestAsJson(thisPageUrl, function(err, data) {
        if (err) {
          console.log("error:",err);
        }
        else {
          try {
            displayPage(data.data.children);
          }
          catch(e) {
            console.log("issues:",e);
          }
        }
      });
    });
  });
}

function getSubreddits(callback) {
  thisPageUrl = 'https://reddit.com/subreddits.json';
  overAllPage = thisPageUrl;
  request(thisPageUrl, function(err, res) {
    if (err) {
      callback(err);
    }
    else {
      try {
        var response = JSON.parse(res.body);
        callback(null, response.data.children);
      }
      catch(err){
         console.log(err);
      }
    }
  });
}

function whichSubreddit(callback){
  inquirer.prompt({
    type:"input",
    name:"answer",
    message: "Which subreddit would you like?"
    }).then(
    function(answer){
      callback(answer.answer);
    });
}

function displayThisSubreddit(){
  whichSubreddit(function(x){
    var url = "https://www.reddit.com/r/"+x+"/.json";
    thisPageUrl = url;
    requestAsJson(url, function(err,data){
      if (err){
        console.log("not working....bitch",err);
      }
      else{
        displayPage(data.data.children, url);
      }
    });
  });
}

function goToNextPage(lastpost){
  var nextPageUrl = (thisPageUrl +"?after="+lastpost);
  overAllPage = nextPageUrl;
  requestAsJson(nextPageUrl, function(err, data){
    if (err){
      console.log("this was a terrible idea");
    }
    else{
      displayPage(data.data.children);
    }
  });
}

function goToPreviousPage(firstpost){
  var previousPageUrl = (thisPageUrl +"?before="+firstpost);
  overAllPage = previousPageUrl;
  requestAsJson(previousPageUrl, function(err, data){
    if (err){
      console.log("this was a really terrible idea");
    }
    else{
      displayPage(data.data.children);
    }
  });
}

function displayPostInforation(postToDisplay, data){
  console.log("\n\nTitle:".bold,postToDisplay.data.title.blue);
  console.log("Author:".bold,postToDisplay.data.author.red);
  console.log("URL:".bold,postToDisplay.data.url.yellow.underline);
  console.log("Number of Upvotes:".bold,postToDisplay.data.ups.toString().green);
  console.log("Number of Comments:".bold,postToDisplay.data.num_comments.toString().green+"\n\n");

  var postMenu = [
    {name : "Go Back", value : "GOBACK"},
    {name : "View Comments", value : "COMMENTS"},
    {name : "Main Menu", value : "MENU"}
  ];
  inquirer.prompt({
    type : "list",
    name : "postmenu",
    message : "What would you like to do?",
    choices : postMenu
  }).then(function(answer){
    switch(answer.postmenu){
      case "GOBACK":
        displayPage(data);
        break;
      case "COMMENTS":
        displayComments(postToDisplay, data);
        break;
      case "MENU":
        startMenu();
        break;
    }
  });
}

function displayPost(postToDisplay,data){
  var urlTypeArray = postToDisplay.data.url.split(".");
  if ((urlTypeArray[urlTypeArray.length-1] == "jpg") || (urlTypeArray[urlTypeArray.length-1] == "jpg") || (urlTypeArray[urlTypeArray.length-1] == "jpg")){
    picToAscii(postToDisplay.data.url);
    setTimeout(function(){
      displayPostInforation(postToDisplay,data);
    }, 500);
  }
  else{
    displayPostInforation(postToDisplay,data);
  }
}

function displayPage(data){
  var postToDisplay;
  var listOfPosts = [];

  data.forEach(function(x){
    listOfPosts.push("Post: "+x.data.title.blue);
  });
  listOfPosts.push(new inquirer.Separator());
  if (ableToGoBack > 0){
    listOfPosts.push("PREVIOUS PAGE".red);
  }
  listOfPosts.push("NEXT PAGE".red,new inquirer.Separator());
  inquirer.prompt({
    type: "list",
    name: "menu",
    message: "which post would you like?",
    choices: listOfPosts
  }).then(
    function(answers){
      if (answers.menu == "NEXT PAGE".red){
        if (data.length > 24){
          ableToGoBack++;
          goToNextPage(data[(data.length)-1].data.name);
        }
      }
      else if (answers.menu == "PREVIOUS PAGE".red){
        // console.log("dammit i said previous page");
        ableToGoBack--;
        goToPreviousPage(data[0].data.name);
        }
      else{
        postToDisplay = data.find(function(x){
          overAllPost = postToDisplay;
          return answers.menu == ("Post: "+x.data.title.blue);
        });
        
        displayPost(postToDisplay, data);
      }
    })
  .catch(function(err){
    console.log(err);
  });
}

function picToAscii (url){
  imageToAscii(url, (err, converted) => {
    console.log(err || converted);
});
}

function displayHomePage(){
  getHomepage(function(err, data,url){
    if (err){
      console.log("shit went down");
    }
    else{
      displayPage(data,url);
    }
  });
}

function dispalySubbredditList(){
  var subredditMenuChoices = [];
  var subredditArray = [];
  getSubreddits(function(err, info){
    if (err){
      console.log("bad subbredits");
    }
    else{
      info.forEach(function(x){
        subredditArray.push(x.data.display_name);
      });
      var subredditSorted = subredditArray.sort();
      subredditSorted.forEach(function(x){
        var y = x.toUpperCase();
        subredditMenuChoices.push({"name": y.green.underline, "value" : x});
      });
      subredditMenuChoices.push(new inquirer.Separator(), {"name": "Back to Menu", "value": "MENU"}, new inquirer.Separator());
      inquirer.prompt({
        type: 'list',
        name: 'subredditMenu',
        message: 'Which Subreddit would you like?',
        choices: subredditMenuChoices
      })
      .then(function(menuChoice) {
        if (menuChoice.subredditMenu == "MENU"){
          startMenu();
        }
        else{
          getSubreddit(menuChoice.subredditMenu, function(err, info){
            if (err){
              console.log("problem with subreddits");
            }
            else{
              displayPage(info);
            }
          
          });
        }
      });
    }
  });
}

function startMenu(){
  var menuChoices = [
    {name: 'Show homepage', value: 'HOMEPAGE'},
    {name: "Show sorted homepage", value : "SORTHOMEPAGE"},
    {name: 'Show subreddit', value: 'SUBREDDIT'},
    {name: "Show sorted subreddit", value: "SORTSUBREDDIT"},
    {name: 'List subreddits', value: 'SUBREDDITS'},
    {name: "Exit", value: "EXIT"}
  ];

  inquirer.prompt({
    type: 'list',
    name: 'menu',
    message: 'What do you want to do?',
    choices: menuChoices
  }).then(function(menuChoices){
    switch(menuChoices.menu) {
      case "HOMEPAGE":
        displayHomePage();
        break;
      case "SORTHOMEPAGE":
        getSortedHomepage();
        break;
      case "SUBREDDIT":
        displayThisSubreddit();
        break;
      case "SORTSUBREDDIT":
        getSortedSubreddit();
        break;
      case "SUBREDDITS":
        dispalySubbredditList();
        break;
      case "EXIT":
        console.log("You'll be back.......  they all come back");
        break;
    }
  })
}

function checkForReplies(comment,commentNumber){
  commentNumber++;
  if (comment.data.replies){
    comment.data.replies.data.children.forEach(function(x){
      var indentAmount = "";
      for(var i = 0; i <= commentNumber; i++){
        indentAmount += "    ";
      }
      if (x.data.body){
        console.log(indentAmount,x.data.author.green,":\n", wrap((x.data.body.blue), {indent : indentAmount},{newline : "\n"}));
        checkForReplies(x, commentNumber);
      }
    });
    commentNumber--;
  }
}

function commentsMenu(data, allData){
  var menuSelections = [
    {name : "Go Back to Post", value : "goback"},
    {name : "Back to List", value : "list"},
    {name : "Main Menu", value : "menu"}
  ];
  
  inquirer.prompt({
    type: "list",
    name: "menu",
    message : "What would you like to do?",
    choices : menuSelections
  }).then(function(answer){
    switch (answer.menu){
      case "goback":
        try{
        console.log("Back to post");
        displayPostInforation(overAllPost);
        }
        catch(e){
          console.log("errEr",e)
        }
        break;
      case "menu":
        startMenu();
        break;
      case "list":
        requestAsJson(overAllPage, function(err, data){
          if (err){
            console.log("errorsss", err);
          }
          else{
            displayPage(data.data.children);
          }
        });
        break;
    }
  });
}

function displayComments(data, allData){
  requestAsJson("https://www.reddit.com/r/"+data.data.subreddit+"/comments/"+ data.data.id + "/.json", function(err, data){
    if(err){
      console.log("commenting error", err);
    }
    else{
      data.forEach(function(x){
        x.data.children.forEach(function(y){
          if (y.data.body){
            console.log(y.data.author.green,":\n",wrap(y.data.body.blue),"\n");
            checkForReplies(y,0);
            console.log("\n");
          }
        });
      });
    }
    commentsMenu(data, allData);
  });
}

startMenu();

// Export the API
module.exports = {
  requestAsJson: requestAsJson,
  getHomepage : getHomepage,
  sortByWhat : sortByWhat,
  getSortedHomepage : getSortedHomepage,
  getSubreddit : getSubreddit,
  getSortedSubreddit : getSortedSubreddit,
  getSubreddits : getSubreddits,
  whichSubreddit : whichSubreddit,
  displayThisSubreddit : displayThisSubreddit,
  goToNextPage : goToNextPage,
  goToPreviousPage : goToPreviousPage,
  displayPage : displayPage,
  picToAscii : picToAscii,
  displayHomePage : displayHomePage,
  displaySubbredditList : dispalySubbredditList,
  startMenu : startMenu,
  checkForReplies : checkForReplies,
  displayComments : displayComments
};
