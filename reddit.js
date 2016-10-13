var request = require('request');
var inquirer = require("inquirer");
var colors = require("colors");
const imageToAscii = require("image-to-ascii");
var wrap = require("word-wrap");


function requestAsJson (url, callback){
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
  // Load reddit.com/.json and call back with the array of posts
  requestAsJson('https://reddit.com/.json', function(err, data) {
    if (err) {
      callback(err);
    }
    else {
      try {
        callback(null, data.data.children); // look at the result and explain why we're returning .data.children
      }
      catch(e) {
        callback(e);
      }
    }
  });
}

/*
This function should "return" the default homepage posts as an array of objects.
In contrast to the `getHomepage` function, this one accepts a `sortingMethod` parameter.
*/
function getSortedHomepage(sortingMethod, callback) {
  // Load reddit.com/{sortingMethod}.json and call back with the array of posts
  // Check if the sorting method is valid based on the various Reddit sorting methods
}

function getSubreddit(subreddit, callback) {
  requestAsJson("https://reddit.com/r/"+subreddit+"/.json", function(err, data){
    console.log("https://reddit.com/r/"+subreddit+"/.json");
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
  })
  // Load reddit.com/r/{subreddit}.json and call back with the array of posts
}

/*
This function should "return" the posts on the front page of a subreddit as an array of objects.
In contrast to the `getSubreddit` function, this one accepts a `sortingMethod` parameter.
*/
function getSortedSubreddit(subreddit, sortingMethod, callback) {
  // Load reddit.com/r/{subreddit}/{sortingMethod}.json and call back with the array of posts
  // Check if the sorting method is valid based on the various Reddit sorting methods
}

function getSubreddits(callback) {
    request('https://reddit.com/subreddits.json', function(err, res) {
    if (err) {
      callback(err);
    }
    else {
      try {
        var response = JSON.parse(res.body);
        callback(null, response.data.children); // look at the result and explain why we're returning .data.children
      }
      catch(e) {
        callback(e);
      }
    }
  });
}

function displayThisSubreddit(){
  console.log("in the function");
  inquirer.prompt({
    type:"input",
    name:"answer",
    message: "Which subreddit would you like?"
    }).then(function(answer){
      getSubreddit(answer.answer, function(err, data){
        if (err){
          console.log("finding problems");
        }
        else{
          displayPage(data);
        }
      });
  });
}

function displayPage(data){
  var postToDisplay;
  var listOfPosts = [];
  data.forEach(function(x){
    listOfPosts.push("Post: "+x.data.title.blue);
  });
  inquirer.prompt({
    type: "list",
    name: "menu",
    message: "which post would you like?",
    choices: listOfPosts
  }).then(
    function(answers){
      postToDisplay = data.find(function(x){
        return answers.menu == ("Post: "+x.data.title.blue);
      });

      console.log("\n\nTitle:".bold,postToDisplay.data.title.blue);
      console.log("Author:".bold,postToDisplay.data.author.red);
      console.log("URL:".bold,postToDisplay.data.url.yellow.underline);
      console.log("Number of Upvotes:".bold,postToDisplay.data.ups.toString().green);
      console.log("Number of Comments:".bold,postToDisplay.data.num_comments.toString().green+"\n\n");
      var urlTypeArray = postToDisplay.data.url.split(".");
      if ((urlTypeArray[urlTypeArray.length-1] == "jpg") || (urlTypeArray[urlTypeArray.length-1] == "jpg") || (urlTypeArray[urlTypeArray.length-1] == "jpg")){
        picToAscii(postToDisplay.data.url);
      }
      inquirer.prompt({
        type:"confirm",
        name:"yesNo",
        message:"Would you like to view the comments?"
      }).then(function(answer){
        if (answer.yesNo){
          displayComments(postToDisplay);
        }
        else{
          startMenu();
        }
      });
    })
    .catch(function(err){
      console.log(err);
    })
}

function picToAscii (url){
  imageToAscii(url, (err, converted) => {
    console.log(err || converted);
});
}

function displayHomePage(){
  getHomepage(function(err, data){
    if (err){
      console.log("shit went down");
    }
    else{
      displayPage(data);
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
    {name: 'Show subreddit', value: 'SUBREDDIT'},
    {name: 'List subreddits', value: 'SUBREDDITS'},
    {name: "Exit", value: "EXIT"}
  ];

  inquirer.prompt({
    type: 'list',
    name: 'menu',
    message: 'What do you want to do?',
    choices: menuChoices
  }).then(
    function(menuChoice) {
      if (menuChoice.menu == "HOMEPAGE"){
        displayHomePage();
      }
      if (menuChoice.menu == "SUBREDDIT"){
        displayThisSubreddit();
      }
      if (menuChoice.menu == "SUBREDDITS"){
        dispalySubbredditList();
      }
    }
  );
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
        console.log(indentAmount,x.data.author.green,":\n", wrap((x.data.body.blue), {indent : indentAmount}),"\n");
        checkForReplies(x, commentNumber);
      }
    });
    commentNumber--;
  }
}

function displayComments(data){
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
  });
}

startMenu();


// Export the API
module.exports = {
  // ...
};
