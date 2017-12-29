CREATE TABLE `position` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mmsi` int(9) NOT NULL,
  `lat` decimal(7,4) NOT NULL,
  `lon` decimal(7,4) NOT NULL,
  `ts` int(11) NOT NULL,
  `dir` int(3) DEFAULT NULL,
  `sog` decimal(6,2) DEFAULT NULL,
  `nav_status` int(2) DEFAULT NULL,
  `dst` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vessel` (
  `mmsi` int(9) NOT NULL,
  `name` varchar(20) NOT NULL,
  `callsign` varchar(7) NOT NULL,
  `dim_a` int(5) DEFAULT NULL,
  `dim_b` int(5) DEFAULT NULL,
  `dim_c` int(5) DEFAULT NULL,
  `dim_d` int(5) DEFAULT NULL,
  `draught` decimal(7,4) DEFAULT NULL,
  `type` int(3) DEFAULT NULL,
  `imo` int(8) DEFAULT NULL,
  PRIMARY KEY (`mmsi`),
  UNIQUE KEY `mmsi` (`mmsi`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

