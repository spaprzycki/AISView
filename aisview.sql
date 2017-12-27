DROP TABLE IF EXISTS `position`;
CREATE TABLE `position` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mmsi` int(9) NOT NULL,
  `type` int(11) NOT NULL,
  `lat` decimal(7,4) NOT NULL,
  `lon` decimal(7,4) NOT NULL,
  `ts` int(11) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `aton_type` int(2) DEFAULT NULL,
  `dir` int(3) DEFAULT NULL,
  `sog` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
