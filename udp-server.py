import socket
import time
import json
import ConfigParser
import os
from libaisview import decodeAis, aisVesselInfoInsert, aisVesselPositionInsert, aisVesselInfoFetch, geoDistance

config = ConfigParser.RawConfigParser()
config.read('udp-server.conf')

receiver = {}

if config.has_option('network', 'listen'):
  UDP_IP_ADDRESS = config.get('network', 'listen')
else:
  UDP_IP_ADDRESS = "127.0.0.1"
if config.has_option('network', 'port'):
  UDP_PORT_NO = config.getint('network', 'port')
else:
  UDP_PORT_NO = 10110  
if config.has_option('general', 'receiver_lat'):
  receiver['lat'] = config.getfloat('general', 'receiver_lat')
if config.has_option('general', 'receiver_lng'):
  receiver['lng'] = config.getfloat('general', 'receiver_lng')
 
serverSock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

serverSock.bind((UDP_IP_ADDRESS, UDP_PORT_NO))

entry = {}
ships = {}

logfile = 'log/aisview-%s.log' % time.strftime("%Y%m%d-%H%M%S")
log = open(logfile,'w')
#os.symlink(logfile, 'log/aisview-current.log')

while True:
  data, addr = serverSock.recvfrom(1024)
  raw = data.strip()
  raw_list = raw.split('\n')
  log.write("%s [RAW] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), raw_list))
  msg = decodeAis(raw_list)
  # Type 1 & Type 3 - ship position reports
  if msg['id'] == 1 or msg['id'] == 3:
    if msg['mmsi'] in ships:
      ships[msg['mmsi']].update({ 'ts': int(time.time()),
                                  'lat': "%.4f"%msg['y'],
                                  'lng': "%.4f"%msg['x'],
                                  'dir': msg['true_heading'],
                                  'nav_status': msg['nav_status'],
                                  'sog': "%.1f"%msg['sog']
                                })
    else:
      ships[msg['mmsi']] = { 'ts': int(time.time()),
                             'mmsi': msg['mmsi'],
                             'msgid': msg['id'],
                             'lat': "%.4f"%msg['y'],
                             'lng': "%.4f"%msg['x'],
                             'dir': msg['true_heading'],
                             'nav_status': msg['nav_status'],
                             'sog': "%.1f"%msg['sog']
                           }
    log.write("%s [T%s decoded] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg['id'], msg))
    log.write("%s [T%s extract] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), ships[msg['mmsi']]['msgid'], ships[msg['mmsi']]))
    if 'name' not in ships[msg['mmsi']]:
      aisVesselInfoFetch(ships[msg['mmsi']],
                         config.get('db', 'db_host'),
                         config.get('db', 'db_user'),
                         config.get('db', 'db_pass'),
                         config.get('db', 'db_name'))
    aisVesselPositionInsert(ships[msg['mmsi']],
                            config.get('db', 'db_host'),
                            config.get('db', 'db_user'),
                            config.get('db', 'db_pass'),
                            config.get('db', 'db_name'))
    if 'lat' in receiver and 'lng' in receiver:
      ships[msg['mmsi']].update({ 'dist': "%.2f"%geoDistance(receiver, ships[msg['mmsi']]) })
    log.write("%s [T%s DB-fill] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), ships[msg['mmsi']]['msgid'], ships[msg['mmsi']]))
  # Type 4 - base station reports
  elif msg['id'] == 4:
    ships[msg['mmsi']] = { 'ts': int(time.time()), 
                           'mmsi': msg['mmsi'],
                           'msgid': msg['id'],
                           'lat': "%.4f"%msg['y'],
                           'lng': "%.4f"%msg['x']
                         }
    if 'lat' in receiver and 'lng' in receiver:
      ships[msg['mmsi']].update({ 'dist': "%.2f"%geoDistance(receiver, ships[msg['mmsi']]) })
#    log.write("%s [T%s extract] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), ships[msg['mmsi']]['msgid'], ships[msg['mmsi']]))
  # Type 5 - ship voyage & static data reports
  elif msg['id'] == 5:
    try:
      ships[msg['mmsi']].update({ 'ts': int(time.time()),
                                  'name': msg['name'],
                                  'dst': msg['destination'],
                                  'callsign': msg['callsign'],
                                  'type': msg['type_and_cargo']
                                })
      log.write("%s [T%s decoded] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg['id'], msg))
      log.write("%s [T%s extract] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), ships[msg['mmsi']]['msgid'], ships[msg['mmsi']]))
      aisVesselInfoInsert(ships[msg['mmsi']],
                      config.get('db', 'db_host'),
                      config.get('db', 'db_user'),
                      config.get('db', 'db_pass'),
                      config.get('db', 'db_name'))
    except Exception as e:
      log.write("%s %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), e))
#    try: 
#    except Exception as e:
#      log.write("%s - %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), 'Error inserting vessel to DB'))
  # Type 21 - AtoN reports
  elif msg['id'] == 21:
    ships[msg['mmsi']] = { 'ts': int(time.time()),
                           'mmsi': msg['mmsi'],
                           'msgid': msg['id'],
                           'lat': "%.4f"%msg['y'],
                           'lng': "%.4f"%msg['x'],
                           'name': msg['name'],
                           'aton_type': msg['aton_type']
                         }
    if 'lat' in receiver and 'lng' in receiver:
      ships[msg['mmsi']].update({ 'dist': "%.2f"%geoDistance(receiver, ships[msg['mmsi']]) })
    log.write("%s [T%s decoded] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg['id'], msg))
    log.write("%s [T%s extract] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), ships[msg['mmsi']]['msgid'], ships[msg['mmsi']]))
  elif msg['id'] == 999:
    log.write("%s - Decoding error - %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg))
    continue
  else:
    log.write("%s - Unknown Message Type - %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg))
    continue
  output = list()
  for i in ships:
    output.append(ships[i])
    if ships[i]['ts'] < int(time.time())-300:
      output.remove(ships[i])
  f = open('markers.json','w')
  f.write(json.dumps(output, indent=4, sort_keys=True))
  f.flush()
# mysql> insert into position (id, mmsi, type, lat, lon, ts, name, aton_type) values (NULL, 992501303, 21, '52.7745', '-5.9517', 1514416112, 'ARKLOW TURBINE 1', 3);
#	print json.dumps(output, indent=4, sort_keys=True)
  log.flush()
f.close()
log.close()
