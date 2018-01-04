import ais
import MySQLdb
from math import sin, cos, sqrt, atan2, radians

# message = ['!AIVDM,2,1,0,B,53`fLaD2<gtq09MV221`Ti@8u8N222222222221?=0>;44B60ARkjjkk,0*1E\r',
#            '!AIVDM,2,2,0,B,0H8888888888880,2*5F']
# message = ['!AIVDM,1,1,,A,13`kDCP01WwUGKlNBGPW0Eh`8@=A,0*59']
# message = ['!AIVDM,2,1,2,A,53f0Rl02>8eSTP7C;W5R118E=>1<P4pptr222217@06<:7?<0BlSm51D,0*33\r',
#            '!AIVDM,2,2,2,A,Q0CH88888888880,2*4C']
# message = ['!AIVDM,1,1,,A,6>jQM800V:C0>da1P104@00,0*50']
# message = {'name': u'MAI LEHMANN @@@@@@@@',
#            'sog': '7.9', 'msgid': 1L, 'mmsi': 305804000L,
#            'ts': 1514544727, 'callsign': u'V2FU9  ',
#            'lat': '52.9402', 'lng': '-5.6731',
#            'dst': u'WARRENPOINT         ', 'dir': 10L}
# message = {'name': u'VALENTINE           ',
#            'sog': '14.0', 'msgid': 1L, 'mmsi': 205461000L,
#            'ts': 1514563793, 'callsign': u'ONJB   ',
#            'lat': '53.0940', 'lng': '-5.9513',
#            'dst': u'BE ZEEBRUGGE        ', 'dir': 170L}
# message = {'sog': '9.6', 'msgid': 1L, 'mmsi': 248022000L,
#            'ts': 1514566921, 'lat': '53.3691',
#            'lng': '-5.9725', 'dir': 238L}


def decodeAis(message):
  words = list()
  i = 0
  for msg in message:
    msg_list = msg.rstrip().split(',')
    words.append(msg_list[5])
    i += 1
  if i > 1:
    fill = 2
  else:
    fill = 0
  sentence = ''.join(words)
  try:
    return ais.decode(sentence, fill)
  except Exception as e:
    return {unicode('id'): long(999), unicode('error'): unicode(str(e))}


def aisVesselPositionInsert(message, db_host, db_user, db_pass, db_name):
# Record every vessel's position in DB
  db = MySQLdb.connect(db_host, db_user, db_pass, db_name)
  cursor = db.cursor()
  if 'dst' not in message:
    message['dst'] = ''
  sql = "INSERT INTO position \
         (id, mmsi, lat, lng, ts, dir, sog, nav_status, dst) \
         VALUES (NULL, %s, %s, %s, %s, %s, %s, %s, %s)"
  try:
    cursor.execute(sql, (message['mmsi'], message['lat'],
                   message['lng'], message['ts'],
                   message['dir'], message['sog'],
                   message['nav_status'],
                   message['dst'].rstrip(' @')))
    db.commit()
    db.close()
    return True
  except Exception as e:
    db.close()
    return str(e)

def aisVesselInfoInsert(message, db_host, db_user, db_pass, db_name):
# Record MMSI>Name>CallSign mapping in DB
  db = MySQLdb.connect(db_host, db_user, db_pass, db_name)
  cursor = db.cursor()
  sql = "INSERT INTO vessel \
         (mmsi, name, callsign, type, updated) \
         VALUES (%s, %s, %s, %s, now()) \
         ON DUPLICATE KEY UPDATE \
         name = %s, callsign = %s, type = %s, updated = now()"
  try:
    cursor.execute(sql, (message['mmsi'], message['name'].rstrip(' @'),
                   message['callsign'].rstrip(' @'), message['type'],
                   message['name'].rstrip(' @'),
                   message['callsign'].rstrip(' @'), message['type']))
    db.commit()
    db.close()
    return True
  except Exception as e:
    db.close()
    return False

def aisVesselInfoFetch(message, db_host, db_user, db_pass, db_name):
# Fetch MMSI>Name>CallSign mapping from DB
  db = MySQLdb.connect(db_host, db_user, db_pass, db_name)
  cursor = db.cursor(cursorclass=MySQLdb.cursors.DictCursor)
  sql = "SELECT * FROM vessel WHERE mmsi = %s"
  try:
    cursor.execute(sql, (message['mmsi']))
    results = cursor.fetchall()
    for row in results:
      message['name'] = row['name']
      message['callsign'] = row['callsign']
    db.close()
    return True
  except Exception as e:
    db.close()
    return str(e)

def geoDistance(coord1, coord2, unit='NM'):
# 
# coord1, coord2 must be dict in following format:
# coord1 = {'lat': 52.1234, 'lng': -6.1234 }
#
  conversion = {'m': 1, 'NM': 1852, 'km': 1000, 'mi': 1609.344}
  if unit in conversion:
    r = 6371000 / conversion[unit]
  else:
    r = 6371000
  try:
    lat1 = radians(float(coord1['lat']))
    lat2 = radians(float(coord2['lat']))
    lng1 = radians(float(coord1['lng']))
    lng2 = radians(float(coord2['lng']))
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlng / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return (r * c)
  except:
    return -1

