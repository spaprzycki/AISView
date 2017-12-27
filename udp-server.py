import ais.stream
import socket
import time
import json
from cStringIO import StringIO

UDP_IP_ADDRESS = "80.93.27.40"
UDP_PORT_NO = 10110

serverSock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

serverSock.bind((UDP_IP_ADDRESS, UDP_PORT_NO))

# https://github.com/asmaloney/Leaflet_Example/blob/master/maps/leaf-demo.js
entry = {}
ships = {}

while True:
    data, addr = serverSock.recvfrom(1024)
    raw = data.strip()
    f = StringIO(raw)
#    print raw
    for msg in ais.stream.decode(f):
	print msg
	entry = { 'mmsi': msg['mmsi'], 'msgid': msg['id'], 'lat': "%.4f"%msg['y'], 'lng': "%.4f"%msg['x'], 'ts': int(time.time()) }
	if 'name' in msg:
		entry['name'] = msg['name']
	if 'aton_type' in msg:
		entry['aton_type'] = msg['aton_type']
	if 'true_heading' in msg:
		entry['dir'] = msg['true_heading']
	if 'sog' in msg:
		entry['sog'] = "%.1f"%msg['sog']
	ships[msg['mmsi']] = entry
#	print ships
	output = list()
	for i in ships:
#		print ships[i]['ts']
		output.append(ships[i])
		if ships[i]['ts'] < int(time.time())-600:
			output.remove(ships[i])
	f = open('markers.json','w')
	f.write(json.dumps(output, indent=4, sort_keys=True))
	f.close()
#	print json.dumps(output, indent=4, sort_keys=True)
