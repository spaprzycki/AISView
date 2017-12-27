function resolveAisType(id) {
  var types = { 1 : "Vessel", 4 : "Base station", 21 : "AtoN" };
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
        if (markers[i].msgid == 1) {
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
        if (markers[i].msgid == 1) {
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
      var tbl_row =  '<td>' + resolveAisType(markers[i].msgid) + '</td>'
      + '<td>' + markers[i].mmsi + '</td>'
      + '<td>' + markers[i].name + '</td>'
      + '<td>' + markers[i].sog + '</td>'
      + '<td>' + last_seen + '</td>';
      tbl_body += "<tr>" + tbl_row + "</tr>";
    }
    $("#reports tbody").html(tbl_body);
//          var popup_string = 'MMSI: ' + markers[i].mmsi
//            + '<br>Name: ' + markers[i].name
//            + '<br>Speed: ' + markers[i].sog + 'kn'
//            + '<br>Last seen: ' + last_seen + ' seconds ago';
//        }
//        else {
//          var popup_string = 'MMSI: ' + markers[i].mmsi
//            + '<br>Name: ' + markers[i].name
//            + '<br>Last seen: ' + last_seen + ' seconds ago';
//        }
  });
  setTimeout(draw_table, 5000);
}

