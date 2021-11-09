//Version 1.2.0

//Counter used for looping through both top and new
var iteration = 1;

//Total pages to access.
//10 is max for subreddits
//20 is max for users
var total_pages = 20;

//Counter for current page accessed
var page = 0;

//Flag to show images
var show_images = false;

//Arrays to collect links
var links = [];
var error_links = [];

//Default image checkbox to false
document.getElementById("chk_images").checked = false;

//Clears the name input box on reload
typeChangeEvent();

//Adds change event listener to the type combo box
document.getElementById("sel_types").addEventListener("change", typeChangeEvent);

//Adds click event listener to the reset button
document.getElementById("btn_reset").addEventListener("click", function () {
    //TODO Clear arrays, reset screen, enable start button
    location.reload();
});

//Adds click event listener to the start button
document.getElementById("btn_start").addEventListener("click", function () {
    var name = document.getElementById("txt_name").value;
    if (name != "") {
        //Disables user input after starting
        document.getElementById("sel_types").disabled = true;
        document.getElementById("sel_sorts").disabled = true;
        document.getElementById("txt_name").disabled = true;
        document.getElementById("btn_start").disabled = true;
        document.getElementById("sel_pages").disabled = true;
        document.getElementById("chk_images").disabled = true;

        //Gets the sorting method
        //Starts with top sort in the case that Top and New are selected
        var sort = "top";
        if (document.getElementById("sel_sorts").value == "both") {
            //Changes value to 0 to enable both sorts to run
            iteration = 0;
        }
        else {
            //Sets sort to selected value
            iteration = 1;
            sort = document.getElementById("sel_sorts").value;
        }

        total_pages = document.getElementById("sel_pages").value;
        show_images = document.getElementById("chk_images").checked;

        //Info: https://github.com/reddit-archive/reddit/wiki
        //Info: https://www.reddit.com/dev/api/
        //Standard reddit URL with .json appended to end
        //Query parameters: 
        //limit=100 is max items
        //t=all is all-time (for top sort, has no effect on new)
        var base_url = "https://api.reddit.com/" + "user" + "/" + name + "?limit=100&t=all";

        //For subreddits, the sort is part of the path and not a query parameter (which has no effect) 
        if (document.getElementById("sel_types").value == "subreddit") {
            base_url = "https://api.reddit.com/" + "r" + "/" + name + "/" + sort + "?limit=100&t=all";
        }

        document.getElementById("status").innerText = "Status: Starting link collection..."

        //Starts the main loop
        getJson(base_url, sort, "");
    }
    else {
        document.getElementById("status").innerText = "Status: Invalid name.";
    }
});

//Event handler for type select combo box
function typeChangeEvent() {
    //Clears the name input box when the type is changed
    document.getElementById("txt_name").value = "";

    //Updates the input box placeholder and label as a result
    if (document.getElementById("sel_types").value == "user") {
        document.getElementById("lbl_name").innerText = "u/";
        document.getElementById("txt_name").placeholder = "username";
    }
    else {
        document.getElementById("lbl_name").innerText = "r/";
        document.getElementById("txt_name").placeholder = "subreddit";
    }
}

/**
 * Gets Reddit JSON based on URL
 * @param {string} url Base url to access
 * @param {string} sort Sort type based on user selection
 * @param {string} Query parameter to advance pages
 */
function getJson(url, sort, after) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url + "&sort=" + sort + "&after=" + after, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    page++;

                    //Enables onscreen content
                    document.getElementById("content").style.display = "block";

                    //Prints out current page being accessed
                    document.getElementById("urls").innerHTML += sort.toUpperCase() + " " + page + ". " + xhr.responseURL + "<br>";

                    //Parses JSON response
                    var json = JSON.parse(xhr.responseText);

                    //Extracts the direct media links from the JSON response
                    extractLinks(json);

                    //On the last page of pull, the after parameter
                    //has null indicating there are no more pages
                    //Marks the page counter has complete to prevent
                    //pulling more pages
                    if (json.data.after == null) {
                        page = total_pages;
                    }

                    //Checks if there are more pages to pull
                    //based on page counter
                    if (page < total_pages) {
                        //Delays next pull for rate limiting
                        //(probably unnecessary)
                        setTimeout(function () {
                            getJson(url, sort, json.data.after);
                        }, 100);
                    }
                    else if (iteration < 1) {
                        //In the case of both Top and New should be accessed
                        //Increments iteration counter to prevent a third loop
                        iteration++;

                        //Resets page counter
                        page = 0;

                        //Cleans up URL in the case of a subreddit
                        if (url.includes("/r/")) {
                            url = url.replace("top", "new");
                        }

                        //Starts the main loop over again with new sort
                        getJson(url, "new", "");
                    }
                    else {
                        //All work is complete
                        showLinks();
                    }
                }
                else {
                    document.getElementById("status").innerText = "Status: Error accessing Reddit.";
                }
            }
        };
        xhr.send(null);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Gets direct links from Reddit JSON
 * @param {JSON} json Reddit JSON object
 */
function extractLinks(json) {
    //Gets JSON array with all posts
    var posts = json.data.children;

    //Loops through each post to get link
    posts.forEach(post => {
        var link = undefined;
        try {
            //Reddit has and old post type (t1)
            //and a new post type (t3) in which
            //the data is organized differently
            //Checks the post type
            if (post.kind == "t1") {
                var url = post.data.link_url;
                if ((url).includes(".gifv")) {
                    //Replaces the file extension in the case of i.imgur.com
                    link = (url).replace("gifv", "mp4");
                }
                else if ((url).includes(".jpg") || (url).includes(".jpeg") || (url).includes(".png") || (url).includes(".gif") || (url).includes(".webm")) {
                    link = url;
                }
                else {
                    throw "Unsupported media type (kind t1)";
                }
            }
            else if (post.kind == "t3") {
                var url = post.data.url;
                if ((url).includes(".gifv")) {
                    link = (url).replace("gifv", "mp4");
                }
                else if ((url).includes(".jpg") || (url).includes(".jpeg") || (url).includes(".png") || (url).includes(".gif") || (url).includes(".webm")) {
                    link = url;
                }
                else if (post.data.domain == "v.redd.it") {
                    //Uses the static video instead of the streaming version
                    //Downside is the filename start with DASH_ instead of unique id
                    link = (post.data.media.reddit_video.fallback_url).replace("?source=fallback", "");
                }
                else if (post.data.domain.includes("redgifs")) {
                    getRedgifsLink(url);
                }
                else if (post.data.domain.includes("gfycat")) {
                    getGfycatLink(url);
                }
                else if (post.data.domain == "imgur.com") {
                    //Cleans up imgur.com links
                    var parts = (url).split("/");
                    link = "https://i.imgur.com/" + parts[parts.length - 1] + ".jpg";
                }
                else {
                    throw "Unsupported media type (kind t3)";
                }
            }
        }
        catch (e) {
            var error_link = "https://www.reddit.com" + post.data.permalink;
            console.error(e + " from " + error_link);

            //Saves the unprocessed links as Reddit posts
            error_links.push('<a href="' + error_link + '" target="_blank">' + error_link + '</a>')
        }

        //Adds link to array
        addToLinks(link);
    });
}

/**
 * Uses Gfycat API to get link
 * @param {string} url Gfycat url
 */
function getGfycatLink(url) {
    //Info: https://developers.gfycat.com/api/#getting-gfycats
    //Splits the url to get the id
    var parts = (url).split("/");
    try {
        var xhr = new XMLHttpRequest();
        //Runs synchronously to avoid ending after content is displayed
        //Obviously could hang
        xhr.open("GET", "https://api.gfycat.com/v1/gfycats/" + parts[parts.length - 1], false);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var gjson = JSON.parse(xhr.responseText);
                    addToLinks(gjson.gfyItem.mp4Url);
                }
                else if (xhr.status === 404) {
                    //Some NSFW gfycats are now redgifs
                    getRedgifsLink(url);
                }
            }
        };
        xhr.send(null);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Uses Redgifs API to get link similar to Gfycat
 * @param {string} url Redgifs url
 */
function getRedgifsLink(url) {
    //Info: https://github.com/Redgifs/api/wiki
    var parts = (url).split("/");
    try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.redgifs.com/v2/gifs/" + parts[parts.length - 1], false);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                var rjson = JSON.parse(xhr.responseText);
                addToLinks(rjson.gif.urls.hd);
            }
        };
        xhr.send(null);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Adds direct media link to array
 * @param {string} link Direct media link
 */
function addToLinks(link) {
    //Checks for duplicate links
    if (link != undefined && !links.includes(link)) {
        links.push(link);
        console.log(link + ", count=" + links.length);
    }
    document.getElementById("status").innerText = "Status: Found " + links.length + " unique links...";
}

/**
 * Updates the page with data
 */
function showLinks() {
    document.getElementById("status").innerText = "Status: Collected " + links.length + " unique links.";
    setTimeout(function () {
        links.forEach(link => {
            setTimeout(() => {
                var html;
                if (show_images) {
                    if (link.includes("mp4") || link.includes("v.redd.it"))
                    {
                        html = '<video controls muted preload="metadata" src="' + link + '"></video>' + "<br>";
                    }
                    else
                    {
                        html = '<img src="' + link + '" loading="lazy">' + "<br>";
                    }
                }
                else {
                    html = '<a href="' + link + '" target="_blank">' + link + '</a>' + "<br>";
                }
                document.getElementById("links").innerHTML += html;
            }, 1);
        });
        error_links.forEach(link => {
            document.getElementById("error_links").innerHTML += link + "<br>";
        });
    }, 100);
}
