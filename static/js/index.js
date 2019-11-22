// Client ID and API key from the Developer Console
var CLIENT_ID = '532409688558-f1u1oo4qehfla09p94rn8p9g5ggplb8e.apps.googleusercontent.com';
var API_KEY = 'AIzaSyA48Sx1n_stlXdP8e12ZSAUL-4w37SsccA';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var items = document.getElementById('items');

var checkoutList = {};

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, error => {
        console.error(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';

        listMajors();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function updateList() {
    let list = document.querySelector("ol");
    list.innerHTML = "";
    Object.keys(checkoutList).forEach(item => {
        let i = document.createElement("li");
        i.innerHTML = item + " : " + checkoutList[item]["quantity"];
        list.appendChild(i);
    })
}

function increment(obj, lim) {
    if (!obj)
        return 1;
    else
        return Math.min(obj['quantity'] + 1, lim);
}

function decrement(obj) {
    if (obj['quantity'] == 1)
        return -1;
    else
        return Math.max(obj['quantity'] - 1, 1);
}

function listMajors() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1hi0CfPSYeptldUUOoDzRNmZJkqcT1YtOERzg_sEVgnU',
        range: 'Inventory!A3:D',
    }).then(response => {
        console.log(response.result)
        var range = response.result;
        if (range.values.length > 0) {
            let container;
            for (i = 0; i < range.values.length; i++) {
                var row = range.values[i];
                if (row[0] != "") {
                    let item = document.createElement("div");
                    item.className = "item";
                    container = item;
                    let name = document.createElement("span");
                    name.innerHTML = row[0];
                    name.className = "name";
                    item.appendChild(name);
                } else {
                    let quantity = document.createElement("span");
                    quantity.innerHTML = "# " + row[1];
                    quantity.className = "specific";
                    quantity.id = container.querySelector(".name").innerHTML;
                    container.appendChild(quantity);
                    items.appendChild(container);
                    quantity.onclick = () => {
                        checkoutList[quantity.id] = {
                            quantity: quantity.innerHTML
                        }
                        updateList()
                    }
                    quantity.oncontextmenu = e => {
                        e.preventDefault();
                        delete checkoutList[name.innerHTML];
                        if (checkoutList[name.innerHTML]) {
                            checkoutList[name.innerHTML] = {
                                quantity: decrement(checkoutList[name.innerHTML])
                            }
                            if (checkoutList[name.innerHTML].quantity == -1)
                            updateList();
                        }
                    }
                }
            }
        } else {
            console.error('No data found.');
        }
    }, response => {
        console.error(response.result.error.message);
    });
}

let teamEntry = document.querySelector("#team"),
    field = teamEntry.getElementsByClassName("drop-prev")[0],
    label = teamEntry.getElementsByClassName("label")[0],
    dropdown = teamEntry.getElementsByClassName("dropdown")[0];

field.onfocus = () => { showDropdown(teamEntry, label, field, dropdown) }
field.onblur = () => { hideDropdown(teamEntry, label, field, dropdown) }

Array.from(dropdown.getElementsByClassName("ditem")).forEach(choice => {
    console.log('t')
    choice.onmousedown = () => {
        field.innerHTML = choice.innerHTML;
        field.style.border = "2px solid #f54f43"
        if (choice.innerHTML == "None" || choice.innerHTML == "")
            field.style.color = "grey";
        else
            field.style.color = "rgb(56, 59, 54)";
        field.blur();
        spreadsheetAction(choice.innerHTML);
    }
});

function showDropdown(head, label, field, dropdown) {
    console.log('focus')
    head.style.zIndex = "5";
    label.style.top = "0px";
    label.style.fontSize = "12px";
    field.style.border = "1px solid gray";
    dropdown.style.display = "block";
    document.body.classList.add("blurred");
}

function hideDropdown(head, label, field, dropdown) {
    console.log('blur')
    if (field.innerHTML == "None" || field.innerHTML == "") {
        label.style.top = "16px";
        label.style.fontSize = "16px";
        field.style.border = "1px solid rgb(252, 252, 252)";
        let color = "lightgrey";
        if (field.classList.contains("drequired"))
            color = "#f54f43"
        field.style.borderBottom = "3px solid " + color
    }
    dropdown.style.display = "none";
}

let action = "checkout";

document.querySelector("#checkout").onclick = () => {
    document.querySelector("#darkener").style.opacity = "50%";
    teamEntry.style.display = "block";
    field.focus();
}

document.querySelector("#return").onclick = () => {
    document.querySelector("#darkener").style.opacity = "50%";
    teamEntry.style.display = "block";
    action = "return";
    field.focus();
}

async function spreadsheetAction(team) {
    await $.ajax({
        type: "POST",
        cache: false,
        url: "/updateSheet",
        dataType: "json",
        data: { list: formatList(team) },
        success: ret => {
            console.log(ret)
        },
        error: err => {
            console.error(err);
        }
    })
    location.reload();
}

function formatList(team) {
    let buffer = action + "|" + team;

    Object.keys(checkoutList).forEach(item => {
        buffer += "|" + item + ":" + checkoutList[item]["quantity"].substring(2);
    });

    return buffer;
}