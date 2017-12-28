#import ais
#import ais.stream
import socket
import time
import json
import ConfigParser
#from cStringIO import StringIO
from libaisview import decode_ais

config = ConfigParser.RawConfigParser()
config.read('udp-server.conf')

if config.has_option('network', 'listen'):
    UDP_IP_ADDRESS = config.get('network', 'listen')
else:
    UDP_IP_ADDRESS = "127.0.0.1"

if config.has_option('network', 'port'):
    UDP_PORT_NO = config.getint('network', 'port')
else:
    UDP_PORT_NO = 10110  

serverSock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

serverSock.bind((UDP_IP_ADDRESS, UDP_PORT_NO))

# https://github.com/asmaloney/Leaflet_Example/blob/master/maps/leaf-demo.js
entry = {}
ships = {}

log = open('aisview-%s.log'%time.strftime("%Y%m%d-%H%M%S"),'w')
while True:
  data, addr = serverSock.recvfrom(1024)
  raw = data.strip()
  raw_list = raw.split('\n')
  log.write("%s - %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), raw_list))
  msg = decode_ais(raw_list)
  log.write("%s - %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg))
  if msg['id'] == 1:
    ships[msg['mmsi']] = { 'ts': int(time.time()),
                           'mmsi': msg['mmsi'],
                           'msgid': msg['id'],
                           'lat': "%.4f"%msg['y'],
                           'lng': "%.4f"%msg['x'],
                           'dir': msg['true_heading'],
                           'sog': "%.1f"%msg['sog']
                         }
  elif msg['id'] == 4:
    ships[msg['mmsi']] = { 'ts': int(time.time()), 
                           'mmsi': msg['mmsi'],
                           'msgid': msg['id'],
                           'lat': "%.4f"%msg['y'],
                           'lng': "%.4f"%msg['x']
                         }
  elif msg['id'] == 5:
    ships[msg['mmsi']].update({ 'name': msg['name'],
                                'dst': msg['destination'],
                                'callsign': msg['callsign']
                              })
  elif msg['id'] == 21:
    ships[msg['mmsi']] = { 'ts': int(time.time()),
                           'mmsi': msg['mmsi'],
                           'msgid': msg['id'],
                           'lat': "%.4f"%msg['y'],
                           'lng': "%.4f"%msg['x'],
                           'name': msg['name'],
                           'aton_type': msg['aton_type']
                         }
  output = list()
  for i in ships:
    output.append(ships[i])
    if ships[i]['ts'] < int(time.time())-300:
      output.remove(ships[i])
  f = open('markers.json','w')
  f.write(json.dumps(output, indent=4, sort_keys=True))
# mysql> insert into position (id, mmsi, type, lat, lon, ts, name, aton_type) values (NULL, 992501303, 21, '52.7745', '-5.9517', 1514416112, 'ARKLOW TURBINE 1', 3);
  f.close()
#	print json.dumps(output, indent=4, sort_keys=True)
  log.flush()
log.close()
