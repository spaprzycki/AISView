function resolveAisType(id) {
  var types = { 1 : "Vessel", 3 : "Vessel", 4 : "Base station", 21 : "AtoN" };
  if (id in types) {
    return types[id];
  }
  else {
    return "Unknown";
  }
}

function getEpoch() {
  d = new Date();
  return Math.round(d.getTime() / 1000);
}

function update_positions() {
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
  $.getJSON("markers.json", function(markers){
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
          pins[markers[i].mmsi] = L.marker([markers[i].lat, markers[i].lng], {icon: ship_orange, rotationAngle: markers[i].dir})
          .bindPopup('MMSI: ' + markers[i].mmsi
            + '<br>Name: ' + markers[i].name
            + '<br>Speed: ' + markers[i].sog + 'kn'
            + '<br>Last seen: ' + last_seen + ' seconds ago')
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
  setTimeout(update_positions, 5000);
}

function draw_table() {
  $.getJSON("markers.json", function(markers){
    var tbl_body = "";
    for (var i=0; i < markers.length; ++i) {
      var last_seen = getEpoch()-markers[i].ts;
      if (markers[i].name) {
        name = markers[i].name.replace(/^\s+|\s+$|@+$/g, "");
      }
      else {
        name = "Unknown";
      }
      var tbl_row =  '<td>' + resolveAisType(markers[i].msgid) + '</td>'
      + '<td><a href="javascript:getPositions(' + markers[i].mmsi + ')">' + markers[i].mmsi + '</a></td>'
      + '<td>' + name + '</td>'
      + '<td>' + markers[i].sog + '</td>'
      + '<td>' + markers[i].dist + '</td>'
      + '<td>' + last_seen + '</td>';
      tbl_body += "<tr>" + tbl_row + "</tr>";
    }
    $("#reports tbody").html(tbl_body);
  });
  setTimeout(draw_table, 30000);
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

