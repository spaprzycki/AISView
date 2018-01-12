function resolveAisType(id) {
  var types = { 1 : "Vessel", 3 : "Vessel", 4 : "Base station", 21 : "AtoN" };
  if (id in types) {
    return types[id];
  }
  else {
    return "Unknown";
  }
}

function pickShipIcon(type) {
  if (type == 30)
    icon = 'orange';
  else if (type >= 40 && type < 50)
    icon = 'yellow';
  else if (type >= 60 && type < 70)
    icon = 'blue';
  else if (type >= 70 && type < 80)
    icon = 'green';
  else if (type >= 80 && type < 90)
    icon = 'red';
  else
    icon = 'grey';
  return icon;
}

function getEpoch() {
  d = new Date();
  return Math.round(d.getTime() / 1000);
}
function plotRange(ts = 14400) {
  var dot_8px = L.icon({
    iconUrl: 'images/green_dot_8.png',
    iconSize: [8, 8]
  })
  $.getJSON("cgi-bin/getRange.cgi?time=" + ts, function(positions){
//    var linepoint = []
    var range = []
    for (var i=0; i < positions.length; ++i) {
          range[positions[i].id] = L.marker([positions[i].lat, positions[i].lng], {icon: dot_8px})
          .bindPopup('Lat: ' + positions[i].lat
            + '<br>Lng: ' + positions[i].lng
            + '<br>Distance: ' + positions[i].distance
            + '<br>Bearing: ' + positions[i].bearing)
          .addTo(mymap);
    }
  });
}

      

function update_positions() {
  var shipIcon = { 'orange': L.icon({
                   iconUrl: 'images/ship_orange.png',
                   iconSize: [12, 24]}),
                   'yellow': L.icon({
                   iconUrl: 'images/ship_yellow.png',
                   iconSize: [12, 24]}),
                   'blue': L.icon({
                   iconUrl: 'images/ship_blue.png',
                   iconSize: [12, 24]}),
                   'green': L.icon({
                   iconUrl: 'images/ship_green.png',
                   iconSize: [12, 24]}),
                   'red': L.icon({
                   iconUrl: 'images/ship_red.png',
                   iconSize: [12, 24]}),
                   'grey': L.icon({
                   iconUrl: 'images/ship_grey.png',
                   iconAnchor: [6, 12],
                   iconSize: [12, 24]})
                 }
  var icon_green_dot_8px = L.icon({
    iconUrl: 'images/green_dot_8.png',
    iconSize: [8, 8]
    //	  iconAnchor: [9, 21],
    //	  popupAnchor: [0, -14]
  })
  var ship_orange = L.icon({
    iconUrl: 'images/ship_orange_24.png',
    iconSize: [12, 24],
  })
  var helicopter = L.icon({
    iconUrl: 'images/helicopter_16.png',
    iconSize: [16, 16],
  })

  $.getJSON("markers.json", function(markers){
//  $.getJSON("cgi-bin/getData.cgi", function(markers){
    for (var i=0; i < markers.length; ++i) {
      var last_seen = getEpoch()-markers[i].ts;
//      console.log(pins[markers[i].mmsi]);
      if (markers[i].mmsi in pins) {
        pins[markers[i].mmsi].setRotationAngle(markers[i].dir);
        pins[markers[i].mmsi].setLatLng([markers[i].lat, markers[i].lng]).update();
        if (markers[i].msgid == 1 || markers[i].msgid == 3) {
          var popup_string = 'MMSI: ' + markers[i].mmsi
            + '<br>Name: ' + markers[i].name
            + '<br>Speed: ' + markers[i].sog + 'kn'
            + '<br>Last seen: ' + last_seen + ' seconds ago';
        }
        else {
          var popup_string = 'MMSI: ' + markers[i].mmsi
            + '<br>Name: ' + markers[i].name
            + '<br>Last seen: ' + last_seen + ' seconds ago';
        }
        pins[markers[i].mmsi]._popup.setContent(popup_string).update();
        timeout_tracker[markers[i].mmsi] = getEpoch();
      }
      else {
        if (markers[i].msgid == 1 || markers[i].msgid == 3) {
          pins[markers[i].mmsi] = L.marker([markers[i].lat, markers[i].lng], {icon: shipIcon[pickShipIcon(markers[i].type)], rotationAngle: markers[i].dir, mmsi: markers[i].mmsi})
          .bindPopup('MMSI: ' + markers[i].mmsi
            + '<br>Name: ' + markers[i].name
            + '<br>Speed: ' + markers[i].sog + 'kn'
            + '<br>Last seen: ' + last_seen + ' seconds ago')
          .on('click', onMarkerClick)
          .on('mouseover', function (e) {
            this.openPopup();
          })
          .on('mouseout', function (e) {
            this.closePopup();
          })
          .addTo(mymap);
          timeout_tracker[markers[i].mmsi] = getEpoch();
        }
        else {
          pins[markers[i].mmsi] = L.marker([markers[i].lat, markers[i].lng], {icon: icon_green_dot_8px})
          .bindPopup('MMSI: ' + markers[i].mmsi
            + '<br>Name: '
            + markers[i].name
            + '<br>Last seen: ' + last_seen + ' seconds ago')
         .addTo(mymap);
          timeout_tracker[markers[i].mmsi] = getEpoch();
        }
      }
    }
//    console.log(timeout_tracker);
//    console.log(getEpoch()-300);
// Removing markers from map isn't working for some reason, to be investigated further.
    for (var k in timeout_tracker) {
      if (timeout_tracker[k] < getEpoch()-300) {
        console.log('Removing ' + k);
        mymap.removeLayer(pins[k]);
      }
    }
  });
  setTimeout(update_positions, 10000);
}

function draw_table() {
  $.getJSON("markers.json", function(markers){
//  $.getJSON("cgi-bin/getData.cgi", function(markers){
    var tbl_body = "";
    for (var i=0; i < markers.length; ++i) {
      var last_seen = getEpoch()-markers[i].ts;
      if (markers[i].name) {
        name = markers[i].name.replace(/^\s+|\s+$|@+$/g, "");
      }
      else {
        name = "Unknown";
      }
      var tbl_row =  '<td>' + resolveAisType(markers[i].msgid) + '</td>';
      if (markers[i].msgid == 1 || markers[i].msgid == 3) {
        tbl_row += '<td><a href="javascript:getPositions(' + markers[i].mmsi + '); getVesselDetails(' + markers[i].mmsi + ')">' + markers[i].mmsi + '</a></td>';
      }
      else {
        tbl_row += '<td>' + markers[i].mmsi + '</td>';
      }
      tbl_row += '<td>' + name + '</td>'
      + '<td>' + markers[i].sog + '</td>'
      + '<td>' + markers[i].dist + '</td>'
      + '<td>' + last_seen + '</td>';
      tbl_body += "<tr>" + tbl_row + "</tr>";
    }
    $("#reports tbody").html(tbl_body);
  });
  setTimeout(draw_table, 10000);
}

function getPositions(mmsi) {
  var tri = L.icon({
    iconUrl: 'images/tri_8.png',
    iconSize: [8, 8],
  })
  if (typeof(line[0]) != 'undefined') {
    mymap.removeLayer(line[0]);
    for (var i=0; i < linemarks.length; ++i) {
      mymap.removeLayer(linemarks[i]);
    }
  }
  $.getJSON("cgi-bin/getPositions.cgi?mmsi=" + mmsi, function(positions){
    var linepoint = []
    for (var i=0; i < positions.length; ++i) {
      var point = new L.LatLng(positions[i].lat, positions[i].lng);
      linepoint.push(point);
//      var mark = new L.marker([positions[i].lat, positions[i].lng], {icon: tri, rotationAngle: positions[i].dir});
//      linemarks.push(mark);
    }
//    for (var i=0; i < linemarks.length; ++i) {
//      linemarks[i].addTo(mymap);
//    }
    line[0] = new L.Polyline(linepoint, {
    color: 'red',
    weight: 2,
    opacity: 0.5,
    smoothFactor: 1
    });
    line[0].addTo(mymap);
//    document.getElementById('testdiv').innerHTML = "";
//    $("#testdiv").html(out);
  });
}

function getMessageRate() {
  $.getJSON("cgi-bin/getPositions.cgi?mmsi=0", function(positions){
    $("#msgrate").html(positions[0].count);
  });
  setTimeout(getMessageRate, 10000);
}

function getVesselDetails(mmsi) {
  $("#vesseldetails tbody").html("");
  $.getJSON("cgi-bin/getVesselDetails.cgi?mmsi=" + mmsi, function(details){
    for (var i=0; i < details.length; ++i) {
      var last_seen = getEpoch()-details[i].ts;
      var tbl_body = '<tr><th colspan="2" class="text-center">Details for ' + details[i].name + ':</th></tr>'
      tbl_body += '<tr><td>Vessel MMSI:</td><td>' + details[i].mmsi + '</td></tr>';
      tbl_body += '<tr><td>Vessel Name:</td><td>' + details[i].name + '</td></tr>';
      tbl_body += '<tr><td>Vessel Type:</td><td>' + details[i].type_desc + '</td></tr>';
      tbl_body += '<tr><td>Vessel Callsign:</td><td>' + details[i].callsign + '</td></tr>';
      tbl_body += '<tr><td>Last recorded speed:</td><td>' + details[i].sog + ' knots</td></tr>';
      tbl_body += '<tr><td>Last recorded status:</td><td>' + details[i].nav_status_desc + '</td></tr>';
      tbl_body += '<tr><td>Last recorded destination:</td><td>' + details[i].dst + '</td></tr>';
      tbl_body += '<tr><td>Last recorded position:</td><td>' + details[i].lat + ', ' + details[i].lng + '</td></tr>';
      tbl_body += '<tr><td>Last seen:</td><td>' + last_seen + ' seconds ago</td></tr>';
    }
    $("#vesseldetails tbody").html(tbl_body);
  });
}
//MMSI
//Vessel Name
//Vessel Type
//Callsign
//Size - not yet
//Draught - not yet
//Last seen speed
//Last seen status
//Last seen destination
//Last seen position
//Last seen

function onMarkerClick(e) {
//  console.log(this.options.mmsi);
  getVesselDetails(this.options.mmsi);
  getPositions(this.options.mmsi);
}
