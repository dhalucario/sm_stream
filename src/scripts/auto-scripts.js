var info;

isDoubles = false;
var obs;
var ip;
var sets = [];
var setPage = 0;

var swapped = false;

const phoneAspect = window.matchMedia("(max-aspect-ratio: 1/1), (max-width: 1000px)");

$(document).ready(function () {
	obsConnect();
	loadChanges();
	updateSeatsLoop();
	changeBestOf(bestOfValue);
	toggleDoubles();
});

function obsConnect() {
	obs = new OBSWebSocket();

	ip = window.location.href.split(":")[1].substring(2);
	obsUrl = "ws://" + ip + ":" + obsPort;

	obs.connect(obsUrl, obsPassword)
		.then(() => {
			$("#obs-wrapper").css('display', 'flex');
			obs.call('GetSceneList')
				.then(function (value) {
					$("#scene-box").css('display', 'flex')
					value["scenes"].forEach(function (scene) {
						$("#scenes").append(new Option(scene["sceneName"], scene["sceneName"]));
					})
					$("#scenes").val(value["current-scene"])
				})
		})
		.catch(err => {
		});
}

function hideColour(player, slot) {
	$(`p${player}-colour${slot}`).attr("src", "");
	$(`p${player}-colour${slot}`).hide();
	$(`p${player}-stock${slot}`).attr("src", "");
	$(`p${player}-stock${slot}` + slot).hide();
};

function resetBackground(player) {
	$(".css" + player).css("background-color", "transparent");
}

function update() {
	player1name = $("#p1-name").val();
	player1char = $("#p1-character-change").attr("character");
	player1colour = $("#p1-character-change").attr("colour");
	player1pronouns = $("#p1-pronouns").val();

	player1dname = $("#p1d-name").val();
	player1dchar = $("#p1d-character-change").attr("character");
	player1dcolour = $("#p1d-character-change").attr("colour");
	player1dpronouns = $("#p1d-pronouns").val();

	player1score = parseInt($("#p1-score-change").val());
	player1entrant = $("#p1-entrant").val();

	player2name = $("#p2-name").val();
	player2char = $("#p2-character-change").attr("character");
	player2colour = $("#p2-character-change").attr("colour");
	player2pronouns = $("#p2-pronouns").val();

	player2dname = $("#p2d-name").val();
	player2dchar = $("#p2d-character-change").attr("character");
	player2dcolour = $("#p2d-character-change").attr("colour");
	player2dpronouns = $("#p2d-pronouns").val();

	player2score = parseInt($("#p2-score-change").val());
	player2entrant = $("#p2-entrant").val();

	round = $("#round-change").val();
	setId = $("#set-id").val()
	tournament = $("#tournament-change").val();

	caster1name = $("#caster1-name").val();
	caster1pronouns = $("#caster1-pronouns").val();

	caster2name = $("#caster2-name").val();
	caster2pronouns = $("#caster2-pronouns").val();

	seatOrdering = [
		$("#p1-left-seat").attr("index"),
		$("#p1-right-seat").attr("index"),
		$("#p2-left-seat").attr("index"),
		$("#p2-right-seat").attr("index"),
	]

	const updateController = new AbortController()
	const updateTimeout = setTimeout(() => {
		updateController.abort()
		$(".update").css("background-color", "#F56262");
		$(".update").css("border-bottom", "3px solid #F53535");
		$(".update").text("Error ");
		$(".update").append('<i class="fa-solid fa-triangle-exclamation"></i>')
		setTimeout(function () {
			$(".update").css("background-color", "#CBFFC7");
			$(".update").css("border-bottom", "3px solid #64B55E");
			$(".update").text("Update ");
			$(".update").append('<i class="fa fa-sync"></i>')
		}, 2000);
	}, 5000);
	fetch("/update", {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			team1: {
				players: [
					{
						name: player1name,
						character: player1char,
						colour: player1colour,
						pronouns: player1pronouns,
						port: info.team1.players[0].port || 1
					},
					{
						name: player1dname,
						character: player1dchar,
						colour: player1dcolour,
						pronouns: player1dpronouns,
						port: info.team1.players[1].port || 2
					}
				],
				score: player1score,
				startggEntrant: player1entrant
			},
			team2: {
				players: [
					{
						name: player2name,
						character: player2char,
						colour: player2colour,
						pronouns: player2pronouns,
						port: info.team2.players[0].port || 3
					},
					{
						name: player2dname,
						character: player2dchar,
						colour: player2dcolour,
						pronouns: player2dpronouns,
						port: info.team2.players[1].port || 4
					},
				],
				score: player2score,
				startggEntrant: player2entrant
			},
			casters: [
				{
					name: caster1name,
					pronouns: caster1pronouns
				},
				{
					name: caster2name,
					pronouns: caster2pronouns
				}
			],
			seatOrdering,
			round,
			startggSetId: setId,
			tournament,
			isDoubles,
			bestOf: bestOfValue
		}),
		signal: updateController.signal
	}).then(() => {
		clearTimeout(updateTimeout)
		$(".update").css("background-color", "#55F76B");
		$(".update").css("border-bottom", "3px solid #349641");
		$(".update").text("Updated ");
		$(".update").append('<i class="fa-solid fa-thumbs-up"></i>')
		setTimeout(function () {
			$(".update").css("background-color", "#CBFFC7");
			$(".update").css("border-bottom", "3px solid #64B55E");
			$(".update").text("Update ");
			$(".update").append('<i class="fa fa-sync"></i>')
		}, 2000);
	})
}

const bgColours = [
	"#442222",
	"#222244",
	"#666622",
	"#224422"
]

const accentColours = [
	"#F56262",
	"#6262F5",
	"#F5F562",
	"#62F562"
]

function resolveTeamColour(colour) {
	switch(colour) {
		case "red":
			return 0;
		case "blue":
			return 1;
		case "green":
			return 3;
		default:
			return 2;
	}
}

function fixPlayerColours() {
	if(!info) {
		return
	}
	//background colours
	if(isDoubles) {
		p1ColourIndex = resolveTeamColour(info.team1.players[0].colour)
		p2ColourIndex = resolveTeamColour(info.team2.players[0].colour)

	} else {
		p1ColourIndex = Math.min(info.team1.players[0].port, 3)
		p2ColourIndex = Math.min(info.team2.players[0].port, 3)
	}
	$("#p1-info-change").css("background-color", bgColours[p1ColourIndex])
	$("input.left").css("border-bottom", `2px solid ${accentColours[p1ColourIndex]}`)
	$("input.left").attr("borderColor", accentColours[p1ColourIndex])
	$("#p2-info-change").css("background-color", bgColours[p2ColourIndex])
	$("input.right").css("border-bottom", `2px solid ${accentColours[p2ColourIndex]}`)
	$("input.right").attr("borderColor", accentColours[p2ColourIndex])
}

function fixSeatColour(index) {
	switch(index) {
		case "1":
		case 1:
		case "2":
		case 2:
			return $("#p1-info-change").css("background-color")
		case "3":
		case 3:
		case "4":
		case 4:
			return $("#p2-info-change").css("background-color")
		default:
			return "#442222"
	}
}

function fixSeatAccent(index) {
	switch(index) {
		case "1":
		case 1:
		case "2":
		case 2:
			return $("input.left").attr("borderColor")
		case "3":
		case 3:
		case "4":
		case 4:
			return $("input.right").attr("borderColor")
		default:
			return "#442222"
	}
}

function loadChanges() {
	$.ajax({
		type: 'GET',
		url: "/info.json",
		data: {},
		success: function (response) {
			info = fixInfo(response);
			//load team1 data
			$("#p1-name-actual").attr("value", info.team1.players[0].name)
			loadCharActual("1", info.team1.players[0].character, info.team1.players[0].colour)
			if (info.team1.players.length >= 2) {
				$("#p1d-name-actual").attr("value", info.team1.players[1].name)
				loadCharActual("1d", info.team1.players[1].character, info.team1.players[1].colour)
			}

			if(document.getElementById("p1-score-actual").value != info.team1.score) {
				document.getElementById("p1-score-actual").value = info.team1.score
				document.getElementById("p1-score-change").value = info.team1.score
			}


			//load team2 data
			$("#p2-name-actual").attr("value", info.team2.players[0].name)
			loadCharActual("2", info.team2.players[0].character, response.team2.players[0].colour)
			if (info.team2.players.length >= 2) {
				$("#p2d-name-actual").attr("value", info.team2.players[1].name)
				loadCharActual("2d", info.team2.players[1].character, response.team2.players[1].colour)
			}

			if(document.getElementById("p2-score-actual").value != info.team2.score) {
				document.getElementById("p2-score-actual").value = info.team2.score
				document.getElementById("p2-score-change").value = info.team2.score
			}

			//fixPlayerColours()

			//casters
			$("#caster1-name").attr("value", info.casters[0].name)
			$("#caster1-pronouns").attr("value", info.casters[0].pronouns)
			$("#caster2-name").attr("value", info.casters[1].name)
			$("#caster2-pronouns").attr("value", info.casters[1].pronouns)

			//load
			$("#round-actual").attr("value", info.round)
			$("#best-of-actual").attr("value", "Bo" + info.bestOf)
		},
		error: function (response) {
			console.log(response)
		},
		timeout: 5000
	})
	if (obs !== null) {
		getRecordStatus();
	}
	setTimeout(loadChanges, 1000)
}

function fixInfo(info) {
    let newInfo = {
        "team1": {
            "players": [
                {
                    "name": info?.team1?.players?.[0]?.name || "Player 1",
                    "character": info?.team1?.players?.[0]?.character || "fox",
                    "colour": info?.team1?.players?.[0]?.colour || "red",
                    "pronouns": info?.team1?.players?.[0]?.pronouns || "",
                    "port": info?.team1?.players?.[0]?.port || 1
                },
                {
                    "name": info?.team1?.players?.[1]?.name || "Player 4",
                    "character": info?.team1?.players?.[1]?.character || "falco",
                    "colour": info?.team1?.players?.[1]?.colour || "red",
                    "pronouns": info?.team1?.players?.[1]?.pronouns || "",
                    "port": info?.team1?.players?.[1]?.port || 2
                }
            ],
            "score": info?.team1?.score || 0,
            "startggEntrant": info?.team1?.startggEntrant || "",
        },
        "team2": {
            "players": [
                {
                    "name": info?.team2?.players?.[0]?.name || "Player 2",
                    "character": info?.team2?.players?.[0]?.character || "sheik",
                    "colour": info?.team2?.players?.[0]?.colour || "blue",
                    "pronouns": info?.team2?.players?.[0]?.pronouns || "",
                    "port": info?.team2?.players?.[0]?.port || 1
                },
                {
                    "name": info?.team2?.players?.[1]?.name || "Player 3",
                    "character": info?.team2?.players?.[1]?.character || "peach",
                    "colour": info?.team2?.players?.[1]?.colour || "blue",
                    "pronouns": info?.team2?.players?.[1]?.pronouns || "",
                    "port": info?.team2?.players?.[1]?.port || 2
                }
            ],
            "score": info?.team2?.score || 0,
            "startggEntrant": info?.team2?.startggEntrant || "",
        },
        "casters": [
            {
                "name": info?.casters?.[0].name || "",
                "pronouns": info?.casters?.[0].pronouns || "",
            },
            {
                "name": info?.casters?.[1].name || "",
                "pronouns": info?.casters?.[1].pronouns || "",
            }
        ],
        "seatOrdering": info?.seatOrdering || [ "1","2","3","4" ],
        "round": info?.round || "",
        "startggGetId": info?.startggGetId || "",
        "tournament": info?.tournament || "",
        "isDoubles": info?.isDoubles || false,
        "bestOf": info?.bestOf || 5,
        "activePlayers": info?.activePlayers || [ 1,2 ]
    }
    return newInfo;
}

function updateSeatsLoop() {
	$(".seat").each((index, seat) => {
		$(seat).find(".name").text(getSeatPlayer($(seat).attr("index")))
		$(seat).css("background-color", fixSeatColour($(seat).attr("index")))
	})
	$("#left-seat-changer").css("background-color", `${fixSeatAccent($("#p1-left-seat").attr("index"))}`)
	$("#left-seat-changer").css("border-bottom", `3px solid ${$("#p1-left-seat").css("background-color")}`)

	$("#right-seat-changer").css("background-color", `${fixSeatAccent($("#p2-left-seat").attr("index"))}`)
	$("#right-seat-changer").css("border-bottom", `3px solid ${$("#p2-left-seat").css("background-color")}`)
	fixPlayerColours()
	setTimeout(updateSeatsLoop, 10)
}

function getSeatPlayer(index) {
	switch(index) {
		case "1":
		case 1:
			return $("#p1-name").val()
		case "2":
		case 2:
			return $("#p1d-name").val()
		case "3":
		case 3:
			return $("#p2-name").val()
		case "4":
		case 4:
			return $("#p2d-name").val()
		default:
			return ""
	}
}

function resetSeats() {
	$(`#p1-left-seat`).attr("index", "1")
	$(`#p1-right-seat`).attr("index", "2")
	$(`#p2-left-seat`).attr("index", "3")
	$(`#p2-right-seat`).attr("index", "4")
}

function swapSeatTeam(i) {
	index1 = $(`#p${i}-left-seat`).attr("index")
	index2 = $(`#p${i}-right-seat`).attr("index")
	$(`#p${i}-left-seat`).attr("index", index2)
	$(`#p${i}-right-seat`).attr("index", index1)
}

function swapSeatSides() {
	index1 = $(`#p1-left-seat`).attr("index")
	index2 = $(`#p1-right-seat`).attr("index")
	index3 = $(`#p2-left-seat`).attr("index")
	index4 = $(`#p2-right-seat`).attr("index")
	$(`#p1-left-seat`).attr("index", index3)
	$(`#p1-right-seat`).attr("index", index4)
	$(`#p2-left-seat`).attr("index", index1)
	$(`#p2-right-seat`).attr("index", index2)
}

function changeScore(value, player) {
	initialScore = $(`#p${player}-score-change`).val()
	if((parseInt(initialScore) <= 0 && value <= -1) || (parseInt(initialScore) >= 99 && value >= 1)) {
		return
	}
	$(`#p${player}-score-change`).val(parseInt(initialScore) + value)
}

function swapSides() {
	player1name = $("#p1-name").val();
	player1dname = $("#p1d-name").val();
	player2name = $("#p2-name").val();
	player2dname = $("#p2d-name").val();

	player1pronouns = $("#p1-pronouns").val();
	player1dpronouns = $("#p1d-pronouns").val();
	player2pronouns = $("#p2-pronouns").val();
	player2dpronouns = $("#p2d-pronouns").val();

	$("#p1-name").val(player2name);
	$("#p1d-name").val(player2dname);
	$("#p2-name").val(player1name);
	$("#p2d-name").val(player1dname);

	$("#p1-pronouns").val(player2pronouns);
	$("#p1d-pronouns").val(player2dpronouns);
	$("#p2-pronouns").val(player1pronouns);
	$("#p2d-pronouns").val(player1dpronouns);
}

function swapTeam(n) {
	player1Name = $(`#p${n}-name`).val();
	player2Name = $(`#p${n}d-name`).val();

	player1Pronouns = $(`#p${n}-pronouns`).val();
	player2Pronouns = $(`#p${n}d-pronouns`).val();

	$(`#p${n}-name`).val(player2Name);
	$(`#p${n}d-name`).val(player1Name);

	$(`#p${n}-pronouns`).val(player2Pronouns);
	$(`#p${n}d-pronouns`).val(player1Pronouns);
}

function toggleDoubles() {
	isDoubles = $(".toggle-doubles").attr("value") != "true"
	//changing to singles
	if (isDoubles) {
		$(".toggle-doubles").attr("value", "true");
		$(".toggle-doubles").text("Singles ");
		$(".toggle-doubles").append("<i class='fa fa-user'></i>");

		$(".name.actual.doubles").hide();
		$(".stock-icon.actual.doubles").hide();

		$(".swap").hide()

		$(".name.change.doubles").hide();
		$(".name.change.doubles").prop("disabled",true);
		$(".pronouns.change.doubles").hide();
		$(".name.change.doubles").prop("disabled",true);
		$(".csp.change.doubles").hide();

		$(".seat.right").hide();
		$(".seat-changer.side").hide();
		$(".fa-chair.doubles").hide();

		//fix seat orientation so always indices 1 and 3
		validIndices = ["1", "3"]
		if(!validIndices.includes($("#p1-left-seat").attr("index"))) {
			swapSeatTeam(1);
		}
		if(!validIndices.includes($("#p2-left-seat").attr("index"))) {
			swapSeatTeam(2);
		}
		isDoubles = false;
	}
	//changing to doubles
	else {
		$(".toggle-doubles").attr("value", "false");
		$(".toggle-doubles").text("Doubles ");
		$(".toggle-doubles").append("<i class='fa fa-user-friends'></i>");

		$(".name.actual.doubles").show();
		$(".stock-icon.actual.doubles").show();

		$(".swap").show()

		$(".name.change.doubles").show();
		$(".name.change.doubles").prop("disabled", false);
		$(".pronouns.change.doubles").show();
		$(".name.change.doubles").prop("disabled", false);
		$(".csp.change.doubles").show();

		$(".seat.right").show();
		$(".seat-changer.side").show();
		$(".fa-chair.doubles").show();

		isDoubles = true;
	}
}

/**
 * Load character into slot
 * @param {String} player 1, 1d, 2, 2d
 * @param {*} character character
 * @param {*} colour colour
 */
function loadCharActual(player, character="empty", colour) {
	const characterActual = $(`#p${player}-character-actual`);
	const characterChange = $(`#p${player}-character-change`)
	if(characterActual.attr("character") !== character || characterActual.attr("colour") !== colour) {
		characterActual.attr("character", character);
		characterActual.attr("colour", colour);
		characterActual.attr("src", `static/img/stock_icons/${character}/${colour}.png`);
	
		characterChange.attr("character", character);
		characterChange.attr("colour", colour);
		characterChange.attr("src", `static/img/csp_icons/${character}/${colour}.png`);
	}
}

/**
 * Load character into slot for changing - use when not updating
 * @param {String} player 1, 1d, 2, 2d
 * @param {*} character character
 * @param {*} colour colour
 */
function loadCharChange(player, character="empty", colour) {
	const characterChange = $(`#p${player}-character-change`)
	characterChange.attr("character", character);
	characterChange.attr("colour", colour);
	characterChange.attr("src", `static/img/csp_icons/${character}/${colour}.png`);
}



function updateScene() {
	newScene = $("#scenes :selected").text();
	obs.call(
		'SetCurrentProgramScene', { 'sceneName': newScene }
	)
		.then(function (value) {
			console.log("Changed scene to '" + newScene + "'");
		})
}

function getRecordStatus() {
	obs.call('GetRecordStatus')
		.catch(() => false)
		.then(({ outputActive }) => {
			$.ajax({
				type: 'GET',
				url: "/recording_status",
				data: {},
				success: function (response) {
					if (outputActive && response.recording_status) {
						$("#ffmpeg-record").text("Recording...");
						$("#ffmpeg-record").css("background-color", "#9146FF");
						$("#ffmpeg-record").css("border-bottom", "3px solid #44158a");
					} else {
						$("#ffmpeg-record").text("Record");
						$("#ffmpeg-record").css("background-color", "#FFFFFF");
						$("#ffmpeg-record").css("border-bottom", "3px solid #AAA");
					}
				},
				error: function (response) {
					console.log(response)
				},
				timeout: 5000
			})
			$('#ffmpeg-record').prop('disabled', !outputActive);
			$('#ffmpeg-clip').prop('disabled', !outputActive);
		});
}

function clip() {
	obs.call(
		'GetRecordStatus'
	)
		.then(function (status) {
			currentColor = $("#ffmpeg-clip").css("background-color");
			currentStatus = $("#ffmpeg-clip").text();
			currentBorder = $("#ffmpeg-clip").css("border-bottom");

			if (!status.outputActive) {
				console.log("OBS not recording")
				$("#ffmpeg-clip").css("background-color", "#F56262");
				$("#ffmpeg-clip").css("border-bottom", "3px solid #F53535");
				setTimeout(function () {
					$(".clip").attr("src", "static/img/clip.svg");
					$("#ffmpeg-clip").css("background-color", "#FFFFFF");
					$("#ffmpeg-clip").css("border-bottom", "3px solid #AAA");
				}, 2000);
				return;
			}

			const recordController = new AbortController()
			const recordTimeout = setTimeout(() => {
				recordController.abort()
				console.log("Horizontal clip: ERROR")
				console.log("Vertical clip  : ERROR")
				$("#ffmpeg-clip").css("background-color", "#F56262");
				$("#ffmpeg-clip").css("border-bottom", "3px solid #F53535");
				setTimeout(function () {
					$(".clip").attr("src", "static/img/clip.svg");
					$("#ffmpeg-clip").css("background-color", "#FFFFFF");
					$("#ffmpeg-clip").css("border-bottom", "3px solid #AAA");
				}, 2000);
				return;
			}, 5000);

			$("#ffmpeg-clip").css("background-color", "#9146FF");
			$("#ffmpeg-clip").css("border-bottom", "3px solid #44158a");

			fetch("/save_clip", {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					timecode: status.outputDuration,
					tournament: info?.tournament || "default",
				}),
				signal: recordController.signal
			})
				.then((response) => {
					clearTimeout(recordTimeout)
					console.log(response.status)
					if (response.status === 200) {
						console.log("Horizontal clip: SAVED")
						console.log("Vertical clip  : SAVED")
						$(".clip").attr("src", "static/img/clip_shut.svg");
						$("#ffmpeg-clip").css("background-color", "#55F76B");
						$("#ffmpeg-clip").css("border-bottom", "3px solid #349641");
						setTimeout(function () {
							$(".clip").attr("src", "static/img/clip.svg");
							$("#ffmpeg-clip").css("background-color", "#FFFFFF");
							$("#ffmpeg-clip").css("border-bottom", "3px solid #AAA");
						}, 2000);
					} else if (response.status === 207) {
						console.log("Horizontal clip: SAVED")
						console.log("Vertical clip  : ERROR")
						$(".clip").attr("src", "static/img/clip_shut.svg");
						$("#ffmpeg-clip").css("background-color", "#f7a655");
						$("#ffmpeg-clip").css("border-bottom", "3px solid #965b34");
						setTimeout(function () {
							$(".clip").attr("src", "static/img/clip.svg");
							$("#ffmpeg-clip").css("background-color", "#FFFFFF");
							$("#ffmpeg-clip").css("border-bottom", "3px solid #AAA");
						}, 2000);
					} else {
						console.log("Horizontal clip: ERROR")
						console.log("Vertical clip  : ERROR")
						$("#ffmpeg-clip").css("background-color", "#F56262");
						$("#ffmpeg-clip").css("border-bottom", "3px solid #F53535");
						setTimeout(function () {
							$(".clip").attr("src", "static/img/clip.svg");
							$("#ffmpeg-clip").css("background-color", "#FFFFFF");
							$("#ffmpeg-clip").css("border-bottom", "3px solid #AAA");
						}, 2000);
					}
				})
		})

}

function changeBestOf(value) {
	if(!value) {
		value = $("#best-of-change").find(":selected").val()
	}
	switch(value) {
		case "3":
			bestOfValue = 3;
			$("#best-of-change").val("3")
			break;
		case "5":
			bestOfValue = 5;
			$("#best-of-change").val("5")
			break;
		default:
			bestOfValue = 5;
	}
}

/**
 * up : direction of page (true/false)
 */
function showSets(up, showButtons) {
	$("#page-left").attr("onclick", `showSets(false, ${showButtons})`)
	$("#page-right").attr("onclick", `showSets(true, ${showButtons})`)
	if (showButtons) {
		$(".startgg.button.save").show()
	} else {
		$(".startgg.button.save").hide()
	}
	const MAX_PER_PAGE = 5;
	if (up) {
		//check if going over the amount
		maxIndex = setPage * MAX_PER_PAGE;
		if (maxIndex < sets.length) {
			setPage++;
		}
		//should never occur but just in case
		else if (setPage > Math.ceil(sets.length / MAX_PER_PAGE)) {
			setPage = Math.ceil(sets.length / MAX_PER_PAGE);
		}
	} else {
		//limit to 1
		if (setPage > 1) {
			setPage--;
		}
		//should never occur but just in case
		else {
			setPage = 1;
		}
	}

	for (x = 0; x < MAX_PER_PAGE; x++) {
		index = x + ((setPage - 1) * MAX_PER_PAGE);
		if (typeof (sets.length) != "undefined") {
			if (sets.length == 0 || index >= sets.length) {
				$(`#set${x + 1}`).css("display", "none");
			} else {
				$("#right-wrapper").css("display", "flex")

				$(`#set${x + 1}`).css("display", "flex");
				$(`#set${x + 1}`).attr("data-id", sets[index]["id"])

				if (sets[index]["player1"]["data"][1]["name"] != "") {
					$(`#set${x + 1}-name1`).text(`${sets[index]["player1"]["data"][0]["name"]} / ${sets[index]["player1"]["data"][1]["name"]}`)
				} else {
					$(`#set${x + 1}-name1`).text(sets[index]["player1"]["data"][0]["name"])
				}
				$(`#set${x + 1}-name1`).attr("data-p1", JSON.stringify(sets[index]["player1"]["data"][0]))
				$(`#set${x + 1}-name1`).attr("data-p2", JSON.stringify(sets[index]["player1"]["data"][1]))
				$(`#set${x + 1}-name1`).attr("data-entrant", JSON.stringify(sets[index]["player1"]["entrantId"]))

				if (sets[index]["player2"]["data"][1]["name"] != "") {
					$(`#set${x + 1}-name2`).text(`${sets[index]["player2"]["data"][0]["name"]} / ${sets[index]["player2"]["data"][1]["name"]}`)
				} else {
					$(`#set${x + 1}-name2`).text(sets[index]["player2"]["data"][0]["name"])
				}
				$(`#set${x + 1}-name2`).attr("data-p1", JSON.stringify(sets[index]["player2"]["data"][0]))
				$(`#set${x + 1}-name2`).attr("data-p2", JSON.stringify(sets[index]["player2"]["data"][1]))
				$(`#set${x + 1}-name2`).attr("data-entrant", JSON.stringify(sets[index]["player2"]["entrantId"]))

				$(`#set${x + 1}-round`).text(sets[index]["round"])
			}
		} else {
			$(`#set${x + 1}`).css("display", "none");
		}
	}
	if (sets.length == 0) {
		$("#right-wrapper").css("display", "none")
	}

	//Hide arrows based on page number
	if (setPage == 1 || setPage == 0) {
		$("#page-left").hide()
	} else {
		$("#page-left").show()
	}
	maxIndex = setPage * MAX_PER_PAGE;
	if (maxIndex >= sets.length) {
		$("#page-right").hide()
	} else {
		$("#page-right").show()
	}
}

function loadSet(x) {
	swapped = false;
	p1Data = JSON.parse($(`#set${x}-name1`).attr("data-p1"))
	$("#p1-name").val(p1Data["name"])
	p1pronouns = p1Data["pronouns"]
	$("#p1-pronouns").val(p1pronouns)
	getCharacterInfo(p1Data.id)
	.then((charInfo) => {
		console.log("Setting character info")
		loadCharChange("1", charInfo.character, charInfo.colour)
	})
	.catch(() => {
		console.log("Error fetching P1 character info")
	})

	p1dData = JSON.parse($(`#set${x}-name1`).attr("data-p2"))
	$("#p1d-name").val(p1dData["name"])
	p1dpronouns = p1dData["pronouns"]
	$("#p1d-pronouns").val(p1dpronouns)
	getCharacterInfo(p1dData.id)
	.then((charInfo) => {
		console.log("Setting character info")
		loadCharChange("1d", charInfo.character, charInfo.colour)
	})
	.catch(() => {
		console.log("Error fetching P1d character info")
	})

	p2Data = JSON.parse($(`#set${x}-name2`).attr("data-p1"))
	$("#p2-name").val(p2Data["name"])
	p2pronouns = p2Data["pronouns"]
	$("#p2-pronouns").val(p2pronouns)
	getCharacterInfo(p2Data.id)
	.then((charInfo) => {
		console.log("Setting character info")
		loadCharChange("2", charInfo.character, charInfo.colour)
	})
	.catch(() => {
		console.log("Error fetching P2 character info")
	})

	p2dData = JSON.parse($(`#set${x}-name2`).attr("data-p2"))
	$("#p2d-name").val(p2dData["name"])
	p2dpronouns = p2dData["pronouns"]
	$("#p2d-pronouns").val(p2dpronouns)
	getCharacterInfo(p2dData.id)
	.then((charInfo) => {
		console.log("Setting character info")
		loadCharChange("2d", charInfo.character, charInfo.colour)
	})
	.catch(() => {
		console.log("Error fetching P2d character info")
	})


	$("#p1-entrant").val($(`#set${x}-name1`).attr("data-entrant"))
	$("#p2-entrant").val($(`#set${x}-name2`).attr("data-entrant"))


	$("#p1-score-change").val(0)
	$("#p2-score-change").val(0)


	$("#round-change").val($("#set" + x + "-round").text())
	$("#set-id").val($(`#set${x}`).attr("data-id"))
}

function saveSet(x) {
	swapped = false;
	$("#p1-entrant-input").val($(`#set${x}-name1`).attr("data-entrant"))
	$("#p1-entrant-name").text($(`#set${x}-name1`).text())
	
	$("#p2-entrant-input").val($(`#set${x}-name2`).attr("data-entrant"))
	$("#p2-entrant-name").text($(`#set${x}-name2`).text())
	
	$("#setID-input").val($(`#set${x}`).attr("data-id"))
}

/* SET DATA */

function updateTournamentData(tournament) {
	$("#tournament-data").empty()
	const tournamentUrl = `${tournament.split(" ").join("_")}.json`
	$("#display-set-results").hide()
	$.ajax({
		type: 'GET',
		url: "/tournaments",
		data: {},
		success: function (response) {
			if (response.includes(tournamentUrl)) {
				$.ajax({
					type: 'GET',
					url: `/tournaments/${tournamentUrl}`,
					data: {},
					success: function (response) {
						$("#tournament-data").append(new Option(`Select set`, -1));
						var index = 0;
						for (let set of response) {
							console.log(response)
							var option = $('<option />')
								.text(`${set.team1.names[0]} vs ${set.team2.names[0]} - ${set.round}`)
								.val(index)
								.attr("data-set", JSON.stringify(set))
								.attr("data-tournament", tournament)
							$("#tournament-data").append(option);
							index++;
						}
						$("#set-update").hide()
						//$("#load-tournament-data").show()
					},
					error: function (e) {
						console.log(`No valid tournament data found for ${tournamentUrl} - ${e}`)
						$("#load-tournament-data").hide()
					},
					timeout: 5000
				})
			} else {
				console.log(`No valid tournament data found for ${tournamentUrl}`)
				$("#load-tournament-data").hide()
			}
		},
		error: function (response) {
			console.log(response)
		},
		timeout: 5000
	})
}

function submitSet() {
	var set = JSON.parse($("#tournament-data :selected").attr("data-set"));
	var startggSet = constructSet($("#p1-entrant-input").val(), $("#p2-entrant-input").val(), set.games, swapped)
	submitStartggSet($(`#setID-input`).val(), $(`#p${set.winner}-entrant-input`).val(), startggSet)
}

//make this shit pretty then make it submit to start.gg
function getTournamentSet() {
	const STOCK_ICON = `static/img/stock_icons`

	var set = JSON.parse($("#tournament-data :selected").attr("data-set"));
	if (!set) {
		return
	}
	$("#display-set-results").empty()
	$("#display-set-results").show()

	var entrantIds = $('<div />')
		.attr('class', 'row')
	$(entrantIds).append($('<input />').val(`${set.team1.entrantId}`).attr('class', 'startgg display id').attr('id', 'p1-entrant-input'))
	$(entrantIds).append($('<button />').attr('onclick', 'swapEntrants()').attr('class', 'startgg entrant swap').attr('id', 'entrant-swap').append(`<i class="fa-solid fa-arrow-right-arrow-left"></i>`))
	$(entrantIds).append($('<input />').val(`${set.team2.entrantId}`).attr('class', 'startgg display id').attr('id', 'p2-entrant-input'))

	$("#display-set-results").append($('<input />').val(`${set.setId}`).attr('class', 'startgg display id').attr('id', 'setID-input'))
	$("#display-set-results").append(entrantIds)

	var playerNames = $('<div />')
		.attr('class', 'row')
		.attr('id', 'startgg-names')
	$(playerNames).append($('<span />').text(set.team1.names[0]).attr('class', 'startgg display name left').attr('id', 'p1-entrant-name'))
	$(playerNames).append($('<span />').text("vs").attr('class', 'startgg'))
	$(playerNames).append($('<span />').text(set.team2.names[0]).attr('class', 'startgg display name right').attr('id', 'p2-entrant-name'))

	$("#display-set-results").append(playerNames)

	for (let game of set.games) {
		var gameRow = $('<div />')
		for (x = 0; x < 4 - game.team1[0].stocks; x++) {
			gameRow.append($('<img />').attr("src", `${STOCK_ICON}/${getDefaultIcon(game.team1[0].character)}`).attr("class", 'stock-icon dark'))
		}
		for (x = 0; x < game.team1[0].stocks; x++) {
			gameRow.append($('<img />').attr("src", `${STOCK_ICON}/${getDefaultIcon(game.team1[0].character)}`).attr("class", 'stock-icon'))
		}
		gameRow.append($('<span />').attr("class", 'stage').text(` ${getStageShort(game.stage)} `))
		for (x = 0; x < game.team2[0].stocks; x++) {
			gameRow.append($('<img />').attr("src", `${STOCK_ICON}/${getDefaultIcon(game.team2[0].character)}`).attr("class", 'stock-icon'))
		}
		for (x = 0; x < 4 - game.team2[0].stocks; x++) {
			gameRow.append($('<img />').attr("src", `${STOCK_ICON}/${getDefaultIcon(game.team2[0].character)}`).attr("class", 'stock-icon dark'))
		}
		$("#display-set-results").append(gameRow);
	}
	$("#display-set-results").append($('<button />').attr('id', 'submit-startgg-set').attr('onClick', 'submitSet()').text("Submit start.gg"));
	index = 1;
	$("#set-update").show()
}

function swapEntrants() {
	swapped = !swapped;
	p1Entrant = $("#p1-entrant-input").val()
	p1Name = $("#p1-entrant-name").text()

	p2Entrant = $("#p2-entrant-input").val()
	p2Name = $("#p2-entrant-name").text()

	$("#p1-entrant-input").val(p2Entrant)
	$("#p1-entrant-name").text(p2Name)

	$("#p2-entrant-input").val(p1Entrant)
	$("#p2-entrant-name").text(p1Name)
}

function showGetSets() {
	$("#get-unfinished-sets").show()
	$("#get-all-sets").show()
}

function updateSet() {
	let data = JSON.parse($('#tournament-data :selected').attr("data-set"))
	data.timecodes[0] = HHmmssToMs($("#timecode-1").val())
	data.timecodes[1] = HHmmssToMs($("#timecode-2").val())

	let index = $('#tournament-data :selected').val()
	let tournament = `${$('#tournament-data :selected').attr("data-tournament")}`

	$.ajax({
		type: 'POST',
		url: "/update_set",
		data: {
			data: data,
			index: index,
			tournament: tournament
		},
		success: function () {
			$("#set-update").css("background-color", "#55F76B");
			$("#set-update").css("border-bottom", "3px solid #349641");
			$("#set-update").text("Success ");
			$("#set-update").append('<i class="fa-solid fa-thumbs-up"></i>')
			setTimeout(function () {
				$("#set-update").css("background-color", "#FFF");
				$("#set-update").css("border-bottom", "3px solid #AAA");
				$("#set-update").text("Submit timestamps");
			}, 2000);
			return true;
		},
		error: function (response) {
			console.error(response)
			$("#set-update").css("background-color", "#F56262");
			$("#set-update").css("border-bottom", "3px solid #F53535");
			$("#set-update").text("Error ");
			$("#set-update").append('<i class="fa-solid fa-triangle-exclamation"></i>')
			setTimeout(function () {
				$("#set-update").css("background-color", "#FFF");
				$("#set-update").css("border-bottom", "3px solid #AAA");
				$("#set-update").text("Submit timestamps");
			}, 2000);
			return false;
		},
		timeout: 5000
	})
}

function updateTimecode(index) {
	const timecode = HHmmssToMs($(`#timecode-${index}`).val())
	const vod = JSON.parse($("#tournament-data :selected").attr("data-set")).vod;
}

function msToHHmmss(ms) {
	let seconds = parseInt(ms / 1000);

	const minutes = parseInt(seconds / 60);
	seconds = seconds % 60;

	const hours = parseInt(seconds / 3600);
	seconds = seconds % 3600;

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

function HHmmssToMs(input) {
	let raw = input.split(".")

	let hhmmss = raw[0].split(":")

	let ms = parseInt(raw[1])

	ms += parseInt(hhmmss[0]) * 60 * 60 * 1000
	ms += parseInt(hhmmss[1]) * 60 * 1000
	ms += parseInt(hhmmss[2]) * 1000

	return ms;
};

function getDefaultIcon(character) {
	switch (character) {
		case "bowser":
		case "link":
		case "luigi":
		case "yoshi":
		case "younglink":
			return `${character}/green.png`
		case "iceclimbers":
		case "marth":
			return `${character}/blue.png`
		case "kirby":
		case "mario":
		case "ness":
		case "peach":
		case "samus":
			return `${character}/red.png`
		default:
			return `${character}/original.png`
	}
}

function getStageShort(stage) {
	switch (stage) {
		case "Yoshi's Story":
		case "Yoshis Story":
			return "YS"
		case "Fountain of Dreams":
			return "FoD"
		case "Pokemon Stadium":
		case "Pokémon Stadium":
			return "PS"
		case "Battlefield":
			return "BF"
		case "Final Destination":
			return "FD"
		case "Dream Land":
		case "Dream Land 64":
		case "Dream Land N64":
			return "DL"
		default:
			return "VS"
	}
}