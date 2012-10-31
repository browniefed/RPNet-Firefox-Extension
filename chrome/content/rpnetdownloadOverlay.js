/* Original Code by 8008132 */
/* Updated by Dman with contributions from thatsgreat2345 and TheShadowOne */

this.rpnet = this.rpnet || {};

rpnet.loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

//new Array("Megaupload\.com", "Rapidshare\.com", "Megashares\.com", "Netload\.in", "Hotfile\.com", "Easy-Share\.com", "Uploaded\.to", "Depositfiles\.com", "Gigasize\.com", "UploadBox\.com", "FileFactory\.com", "FileServe\.com");

rpnet.supported = new Array(
	"rapidshare\.com\/files\/[a-zA-Z0-9]+\/[^\"'\\\s<]+",
	"megashares\.com\/\\?[a-zA-Z0-9]+=[a-zA-Z0-9]+",
	"megashares\.com\/dl\/[a-zA-Z0-9]+", 
	"netload\.in\/[a-zA-Z0-9]+",
	"hotfile\.com\/dl\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/", 
	"crocko\.com\/[a-zA-Z0-9]+\/[^\"'\\\s<]+",
	"uploading\.com\/files\/[^\"'\\\s<]+",
	"uploaded\.to\/file\/[a-zA-Z0-9]+",
	"uploaded\.net\/file\/[a-zA-Z0-9]+",
	"ul\.to\/[a-zA-Z0-9]+",
	"filefactory\.com\/file\/[a-zA-Z0-9]+",
	"filepost\.com\/files\/[^\"'\\\s<]+",
	"freakshare\.com\/files\/[^\"'\\\s<]+",
	"turbobit\.net\/[^\"'\\\s<]+\.html",
	"extabit\.com\/file\/[^\"'\\\s<]+",
	"bitshare\.com\/files\/[a-zA-Z0-9]+/[^\"'\\\s<]+",
	"ifile\.it\/[^\"'\\\s<]+",
	"jumbofiles.com\/[^\"'\\\s<]+",
	"share-online.biz\/dl\/[^\"'\\\s<]+",
	"letitbit.net\/download\/[^\"'\\\s<]+\/[^\"'\\\s<]+",
	"ryushare\.com\/[^\"'\\\s<]+\/[^\"'\\\s<]+",
	"filehost.ws\/[^\"'\\\s<]+",
	"filesabc.com\/[^\"'\\\s<]+\/[^\"'\\\s<]+",
	"sharebees.com\/[^\"'\\\s<]+",
	"filemates.com\/[^\"'\\\s<]+\/[^\"'\\\s<]+",
	"slingfile.com\/file\/[^\"'\\\s<]+"
);

rpnet.regex = null;

rpnet.init = function ()
{
	var contextMenu = document.getElementById("contentAreaContextMenu");
	
	if (contextMenu)
	{
		contextMenu.addEventListener("popupshowing", rpnet.showOrHide, false);
	}
	
	rpnet.regex = new RegExp("(http?s:\/\/[a-zA-Z0-9-\.]*|[a-zA-Z0-9-\.]*)(?="+rpnet.supported.join("|")+")("+rpnet.supported.join("|")+")","gi");
}

rpnet.showOrHide = function (event)
{
	/* code taken from thatsgreat2345 */
	var menuItem = document.getElementById("rpnetdownload"),
	url = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
	arr = url.match(rpnet.regex);
	menuItem.hidden = true;
	if (gContextMenu.isTextSelected) {
		gContextMenu.showItem("rpnetdownload", gContextMenu.isTextSelected);
	} else if (gContextMenu.onLink) {
		if (document.commandDispatcher.focusedElement.toString().match(rpnet.regex)) {
			gContextMenu.showItem("rpnetdownload", gContextMenu.onLink);
		} else {
			menuItem.hidden = true;
		}
	} else if(arr.length > 0) {
		gContextMenu.showItem("rpnetdownload", true);
	} else {
		menuItem.hidden = true;
	}
}

rpnet.login = function(loginInfo, selection)
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "https://premium.rpnet.biz/login.php");
    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    xmlhttp.onreadystatechange = function()
	{
        if (xmlhttp.readyState == 4)
		{
            if (xmlhttp.status == 200 || xmlhttp.status == 304)
			{
				var response = xmlhttp.responseText;
				var matches = response.match(/LOGOUT/i);
				if(matches)
				{
					rpnet.convertAndSend(selection);
				}
				else
				{
					alert("(rpnet) Error:\r\n Failed to login to rpnet.");
				}
            }
            else
			{
                throw Error("rpnet download: xmlhttp failure (Status = "+xmlhttp.status+")");
            }
        }
    }

    xmlhttp.send("login=&"+loginInfo.usernameField+"="+loginInfo.username+"&"+loginInfo.passwordField+"="+loginInfo.password);
}

rpnet.convertAndSend = function (selection)
{
	var dataString = "links=" + selection + "&download=Download"; //Make the post String
	
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "https://premium.rpnet.biz/usercp.php?action=downloader");
    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    xmlhttp.onreadystatechange = function()
	{
        if (xmlhttp.readyState == 4)
		{
            if (xmlhttp.status == 200 || xmlhttp.status == 304)
			{
				var response = xmlhttp.responseText;
				var matches = response.match(/<textarea class="TransTextArea" name = "links" rows = "7" cols = "80" id = "links">([^<]+)(?=<\/textarea>)/i);
				if(matches)
				{
					var downloads = matches[1].split(/\r\n/);
					selection = selection.split("\n");
					
					var links = [];
					for(var i = 0; i < downloads.length; i++)
					{
						var o = {};
						o["href"] = downloads[i];
						o["description"] = selection[i];
						links.push(o)
					}
					
					gFlashGot.download(links);
				}
				else if( (matches = response.match(/<div class="msgerror">(.+)(?=<\/div>)/i)) )
				{
					alert("(rpnet) Error:\r\n"+matches[1].replace(/<\s*br[^>]+>/gi, '\r\n'));
				}
				else if( (matches = response.match(/LOGIN/i)) )
				{
					var logins = rpnet.loginManager.findLogins({}, "https://premium.rpnet.biz", "", "");

					if(logins.length > 0)
					{
						rpnet.login(logins[0], selection);
					}
					else
					{
						var tabadded = gBrowser.addTab("https://premium.rpnet.biz/login.php", null, null, null);
						gBrowser.selectedTab = tabadded;
						//var newTabBrowser = gBrowser.getBrowserForTab(tabadded);
					}
				}
            }
            else
			{
                throw Error("rpnet download: xmlhttp failure (Status = "+xmlhttp.status+")");
            }
        }
    }

    xmlhttp.send(dataString);
}

rpnet.doDownload = function ()
{
	var selection = document.commandDispatcher.focusedWindow.getSelection(); //Get selected text..
	var selectedLink = document.commandDispatcher.focusedElement,
	url = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
	urlMatch = url.match(rpnet.regex);
	var html = "";
	if (urlMatch !== null) {
		html = url;
	} else if (selectedLink !== null) {
		if (selectedLink.tagName == 'A') {
			html = selectedLink.href;
		}
	} else {
		for(var i = 0; i < selection.rangeCount; i++)
		{
			var rng = selection.getRangeAt(i);
			
			var parentNode = rng.startContainer.parentNode;
			if(rng.startContainer.nodeValue == rng.endContainer.nodeValue && parentNode.nodeName == "A")
			{
				html += new XMLSerializer().serializeToString(parentNode);
			}
			else
			{
				html += new XMLSerializer().serializeToString(rng.cloneContents());
			}
		}
	}
	
	var arr = html.match(rpnet.regex);
	
	if(arr)
	{
		arr = arr.sort();
		
		var matches = [];
		
		for (var i = 0; i < arr.length; i++) {
			if (matches.indexOf(arr[i]) === -1) {
				matches.push(arr[i]);
			}
		}
		/*if(arr[0].toLowerCase().indexOf("netload.in") !== -1)
		{
			matches.push(arr[0]+".htm");
		}
		else
		{
			matches.push(arr[0]);
		}
		
		for (var i = 0; i < arr.length - 1; i++)
		{
			var first = arr[i].toLowerCase(),
				second = arr[i+1].toLowerCase();
	
			if(first != second)
			{
				if(first.indexOf("rapidshare.com") !== -1 && second.indexOf("rapidshare.com") !== -1)
				{
					if(first.substring(0, first.lastIndexOf("/")) != second.substring(0, second.lastIndexOf("/")))
					{
						matches.push(arr[i+1]);
					}
				}
				else if(second.indexOf("netload.in") !== -1)
				{
					matches.push(arr[i+1]+".htm");
				}
				else
				{
					matches.push(arr[i+1]);
				}
			}
		}*/
		
		rpnet.convertAndSend(matches.join("\n"));
	}
	else
	{
		alert("(Plugin) Notice:\r\n No rpnet supported links found.");
	}
}

window.addEventListener("load", rpnet.init, false); //Initialise the JS...
