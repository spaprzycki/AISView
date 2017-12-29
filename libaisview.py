import ais

#message = ['!AIVDM,2,1,0,B,53`fLaD2<gtq09MV221`Ti@8u8N222222222221?=0>;44B60ARkjjkk,0*1E\r', '!AIVDM,2,2,0,B,0H8888888888880,2*5F']
#message = ['!AIVDM,1,1,,A,13`kDCP01WwUGKlNBGPW0Eh`8@=A,0*59']
#message = ['!AIVDM,2,1,2,A,53f0Rl02>8eSTP7C;W5R118E=>1<P4pptr222217@06<:7?<0BlSm51D,0*33\r', '!AIVDM,2,2,2,A,Q0CH88888888880,2*4C']

#message = ['!AIVDM,1,1,,A,6>jQM800V:C0>da1P104@00,0*50']

def decode_ais(message):
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
    return {unicode('error'): unicode(str(e))}

#print decode_ais(message)
